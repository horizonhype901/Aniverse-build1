import { AvatarConfig } from '../types';

export const SKINS = ['#FFDFC4', '#F0C8A0', '#D8A066', '#A06A3C', '#6F4423', '#4A2E1B'];
export const SKIN_NAMES = ['Porcelain', 'Sand', 'Honey', 'Amber', 'Chestnut', 'Espresso'];

export const FACES = ['Round', 'Oval', 'Soft'];
export const FACE_DIMS = [
  { rx: 52, ry: 55 },
  { rx: 46, ry: 60 },
  { rx: 54, ry: 52 },
];

export const EYES = ['Sparkle', 'Sharp', 'Happy', 'Sleepy', 'Wink', 'Starry'];
export const EYE_COLORS = ['#5B3A29', '#2E86C1', '#27AE60', '#8E44AD', '#E74C3C', '#F5A623'];
export const EYE_COLOR_NAMES = ['Brown', 'Blue', 'Green', 'Violet', 'Red', 'Amber'];

export const BROWS = ['Soft', 'Straight', 'Bold', 'Arched'];

export const MOUTHS = ['Smile', 'Grin', 'Smirk', 'Open', 'Chill', 'Cat :3'];

export const HAIRS = ['Spiky', 'Bob', 'Long', 'Ponytail', 'Buns', 'Messy', 'Buzz', 'Twintails'];
export const HAIR_COLORS = ['#23232B', '#6B4A2F', '#C0392B', '#E8B93C', '#58B368', '#4AA8DE', '#9B5DE5', '#F15BB5'];
export const HAIR_COLOR_NAMES = ['Midnight', 'Chestnut', 'Crimson', 'Blonde', 'Mint', 'Sky', 'Violet', 'Bubblegum'];

export const ACCESSORIES = ['None', 'Star headphones', 'Glasses', 'Star pin', 'Headband', 'Cat ears'];

export const BGS: [string, string][] = [
  ['#FF4D6D', '#8B5CF6'],
  ['#22D3EE', '#8B5CF6'],
  ['#FFC94D', '#FF4D6D'],
  ['#4ADE80', '#22D3EE'],
  ['#1B1533', '#3B2D6E'],
  ['#F472B6', '#8B5CF6'],
  ['#0D0A1A', '#4A3B8C'],
  ['#FF9A8B', '#B565D8'],
];
export const BG_NAMES = ['Sunset', 'Ocean', 'Candy', 'Meadow', 'Midnight', 'Bloom', 'Galaxy', 'Peach'];

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 0, face: 0, eyes: 0, eyeColor: 0, brows: 0,
  mouth: 0, hair: 0, hairColor: 0, accessory: 0, bg: 0,
};

/** Deterministic avatar per display name — the community's faces. */
export function avatarFor(name: string): AvatarConfig {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const pick = (n: number, salt: number): number => {
    const chunk = (((h >> salt) % 1000) + 1000) % 1000;
    return Math.floor((chunk / 1000) * n);
  };
  const mod = (v: number, n: number) => ((v % n) + n) % n;
  return {
    skin: mod(h + pick(6, 0), 6),
    face: mod(pick(3, 3), 3),
    eyes: mod(pick(6, 5), 6),
    eyeColor: mod(h + pick(6, 7), 6),
    brows: mod(pick(4, 9), 4),
    mouth: mod(pick(6, 11), 6),
    hair: mod(pick(8, 13), 8),
    hairColor: mod(h + pick(8, 15), 8),
    accessory: mod(pick(6, 17), 6),
    bg: mod(h + pick(8, 19), 8),
  };
}

export function randomAvatar(): AvatarConfig {
  const r = (n: number) => Math.floor(Math.random() * n);
  return {
    skin: r(6), face: r(3), eyes: r(6), eyeColor: r(6), brows: r(4),
    mouth: r(6), hair: r(8), hairColor: r(8), accessory: r(6), bg: r(8),
  };
}
