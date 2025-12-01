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

export interface WallElement {
  id: string;
  type: 'exterior' | 'interior';
  name: string;
  length: number; // For interior walls
  height: number;
  // Position relative to center or corner? Let's stick to "Position from Center" for consistency with threejs group
  // OR relative to a corner (0,0 top-left of floorplan)
  // For simplicity in this refactor, let's keep Exterior walls "Fixed" but wrapped in this type
  // Interior walls: startPoint, endPoint? Or Center + Rotation?
  // Let's use Center + Rotation for ThreeJS ease
  position: { x: number, y: number, z: number }; 
  rotation: number; // radians
  
  // For UI "Builder" mode logic:
  isLocked?: boolean; // Exterior walls are locked to room dimensions
}

export interface Opening {
  id: string;
  type: 'window' | 'door';
  wallId: string; // Link to WallElement.id
  position: number; // Distance from start of wall (left side)
  width: number;
  height: number;
  floorHeight: number;
}

export interface Cabinet {
  id: string;
  name: string;
  width: number;    // inches
  depth: number;    // inches
  height: number;   // inches
  doorCount: number; // Number of doors
}

export interface CutItem {
  material: string;
  description: string;
  length: number; // in inches usually, or feet for some
  count: number;
}

export interface CabinetResults {
  materials: {
    oneByTwelve: number;
    oneByEight: number;
    oneByFour: number;
    plywood: number;
    hardwood: number;
  };
  totalCost: number;
  cutList: CutItem[];
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
  joist: { width: 1.5, height: 7.25 }, 
  header: { width: 3.0, height: 5.5 }, 
  sill: { width: 1.5, height: 3.5 },
  rafter: { width: 1.5, height: 5.5 }, 
  ridge: { width: 1.5, height: 7.25 }  
};
