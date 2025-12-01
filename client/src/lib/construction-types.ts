import * as THREE from 'three';

export type LumberType = 'stud' | 'beam' | 'plate' | 'joist' | 'header' | 'sill' | 'king' | 'cripple' | 'window' | 'door' | 'rafter' | 'ridge' | 'rimJoist';
export type MaterialType = LumberType | 'concrete' | 'sheathing' | 'shingle' | 'plywood';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  studLength: number;
  beamLength: number;
  roofPitch: number; // x/12
  overhang: number; // inches
}

export interface Prices {
  stud: number; // 2x4
  beam: number; // 2x6
  sheetrock: number;
  plywood: number; // 4x8 sheet
  shingleSquare: number; // Bundle price or Square price? Let's use Bundle (3 per square usually) or just Square price. Let's say "Price per Bundle" usually $35-40
  concrete: number; // Per cubic yard
}

export interface Opening {
  id: string;
  type: 'window' | 'door';
  wall: 'front' | 'right' | 'back' | 'left';
  position: number;
  width: number;
  height: number;
  floorHeight: number;
}

export interface CutItem {
  material: string;
  description: string;
  length: number; // in inches usually, or feet for some
  count: number;
}

export const COLORS: Record<LumberType | string, string> = {
  stud: '#D2B48C',
  beam: '#8B4513',
  plate: '#DEB887',
  joist: '#A0522D',
  header: '#CD853F',
  sill: '#CD853F',
  king: '#B8860B',
  cripple: '#DAA520',
  window: '#87CEEB',
  door: '#8B4513',
  rafter: '#A0522D',
  ridge: '#8B4513',
  rimJoist: '#8B4513',
  concrete: '#808080',
  sheathing: '#E3C099', // Plywood color
  shingle: '#333333'   // Dark grey
};

export const LUMBER_DIMENSIONS = {
  stud: { width: 1.5, height: 3.5 },
  beam: { width: 1.5, height: 5.5 },
  plate: { width: 1.5, height: 3.5 },
  joist: { width: 1.5, height: 7.25 }, // 2x8 for floor joists often, but let's stick to 2x6 for consistency or upgrade? The user asked for "Joyce's" (Joists). Let's assume 2x8 for floor, 2x6 for ceiling. Let's stick to 2x6 (1.5 x 5.5) for simplicity unless specified.
  header: { width: 3.0, height: 5.5 }, // Double 2x6
  sill: { width: 1.5, height: 3.5 },
  rafter: { width: 1.5, height: 5.5 }, // 2x6 rafters
  ridge: { width: 1.5, height: 7.25 }  // 2x8 ridge
};
