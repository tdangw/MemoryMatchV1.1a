import { COSMETIC_FORMS } from './cosmeticForms.generated.js';
import { cosmeticForm } from './cosmeticProgression.js';

/** Missing art keeps the original image; it never changes the recorded level. */
export function cosmeticFiles(item, level=1) {
  return COSMETIC_FORMS[item.id]?.[cosmeticForm(level)] || item.files;
}
export function cosmeticArtUrl(item,size=256,level=1) {
  if(![128,256,512].includes(size))throw new RangeError('Unsupported cosmetic image size');
  return `${import.meta.env?.BASE_URL || '/'}${cosmeticFiles(item,level)[size]}`;
}
export function cosmeticLevel(appearance,id) {
  return appearance?.spark?.state?.cosmeticProgress?.levels[id] || 1;
}
