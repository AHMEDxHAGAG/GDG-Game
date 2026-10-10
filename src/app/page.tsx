import { ExpeditionProvider } from '@/features/expedition/state/ExpeditionProvider';
import { ExpeditionFooter, ExpeditionShell } from '@/features/expedition/components/ExpeditionShell';

export default function HomePage(): React.JSX.Element {
  return (
    <ExpeditionProvider>
      <ExpeditionShell />
      <ExpeditionFooter />
    </ExpeditionProvider>
  );
}
