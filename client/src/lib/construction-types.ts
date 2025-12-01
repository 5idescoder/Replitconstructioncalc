import * as THREE from 'three';

export type LumberType = 'stud' | 'beam' | 'plate' | 'joist' | 'header' | 'sill' | 'king' | 'cripple' | 'window' | 'door';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  studLength: number;
  beamLength: number;
}

export interface Prices {
  stud: number;
  beam: number;
  sheetrock: number;
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

export const COLORS: Record<LumberType, string> = {
  stud: '#D2B48C',
  beam: '#8B4513',
  plate: '#DEB887',
  joist: '#A0522D',
  header: '#CD853F',
  sill: '#CD853F',
  king: '#B8860B',
  cripple: '#DAA520',
  window: '#87CEEB',
  door: '#8B4513'
};

export const LUMBER_DIMENSIONS = {
  stud: { width: 1.5, height: 3.5 },
  beam: { width: 1.5, height: 5.5 },
  plate: { width: 1.5, height: 3.5 },
  joist: { width: 1.5, height: 5.5 },
  header: { width: 3.0, height: 5.5 },
  sill: { width: 1.5, height: 3.5 }
};
