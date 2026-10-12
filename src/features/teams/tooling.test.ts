import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

describe('offline E2E wrapper', () => {
  it('empty scoped variables override production dotenv values while unsetting does not', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'gdg-offline-dotenv-'));
    try {
      writeFileSync(path.join(root, '.env.local'),
        'NEXT_PUBLIC_SUPABASE_URL=https://example.invalid\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-key\n');
      const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production', __NEXT_PROCESSED_ENV: '' };
      delete env.NEXT_PUBLIC_SUPABASE_URL;
      delete env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const modulePath = createRequire(import.meta.url).resolve('@next/env');
      const script = `require(${JSON.stringify(modulePath)}).loadEnvConfig(${JSON.stringify(root)}, false);
        process.stdout.write(JSON.stringify([process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY]));`;
      const run = (variables: NodeJS.ProcessEnv) => {
        const result = spawnSync(process.execPath, ['-e', script], { env: variables, encoding: 'utf8' });
        expect(result.status, result.stderr).toBe(0);
        return JSON.parse(result.stdout);
      };
      expect(run(env)).toEqual(['https://example.invalid', 'test-key']);
      expect(run({ ...env, NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' })).toEqual(['', '']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([0, 7])('scopes empty env values, cleans children/output, and preserves exit %s', (status) => {
    const root = mkdtempSync(path.join(tmpdir(), 'gdg-offline-wrapper-'));
    try {
      mkdirSync(path.join(root, 'tools'));
      mkdirSync(path.join(root, 'bin'));
      copyFileSync('tools/serve-without-supabase.sh', path.join(root, 'tools/serve-without-supabase.sh'));
      const executable = (name: string, body: string) => writeFileSync(path.join(root, 'bin', name),
        `#!/usr/bin/env bash\nset -eu\n${body}\n`, { mode: 0o755 });
      executable('npm', `
if [[ "$2" == "build" ]]; then
  mkdir -p .next-no-project
  printf '%s|%s' "\${NEXT_PUBLIC_SUPABASE_URL-unset}" "\${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY-unset}" > build-env
else
  sleep 60 &
  echo "$!" > child-pid
  wait
fi`);
      executable('curl', 'exit 0');
      executable('npx', `
for _ in $(seq 1 100); do
  [[ -f child-pid ]] && break
  sleep 0.01
done
printf '%s|%s' "$NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" > playwright-env
exit ${status}`);
      const outcome = spawnSync('bash', ['tools/serve-without-supabase.sh'], {
        cwd: root, encoding: 'utf8', timeout: 10_000,
        env: { ...process.env, PATH: `${path.join(root, 'bin')}:${process.env.PATH}`,
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
          TMPDIR: root },
      });
      expect(outcome.error).toBeUndefined();
      expect(outcome.status, outcome.stderr).toBe(status);
      expect(readFileSync(path.join(root, 'build-env'), 'utf8')).toBe('|');
      expect(readFileSync(path.join(root, 'playwright-env'), 'utf8')).toBe('https://example.invalid|test-key');
      expect(existsSync(path.join(root, '.next-no-project'))).toBe(false);
      const pid = readFileSync(path.join(root, 'child-pid'), 'utf8').trim();
      // A dead child may briefly await reaping by init; a zombie cannot serve a port.
      const stat = `/proc/${pid}/stat`;
      if (existsSync(stat)) expect(readFileSync(stat, 'utf8').split(') ')[1]?.[0]).toBe('Z');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
