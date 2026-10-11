import assets from '@/generated/ui-assets.json';
import type { EmblemId } from '@/features/characters/types';

export const UI_ASSETS = assets;
export type SceneId = 'harbour' | 'cabin' | 'gallery' | 'voyage' | 'deck';

export const EMBLEM_ASSETS: Record<EmblemId, 'gear' | 'brain' | 'code' | 'bars' | 'shield'> = {
  gear: 'gear',
  robot: 'brain',
  globe: 'code',
  chart: 'bars',
  shield: 'shield',
};
