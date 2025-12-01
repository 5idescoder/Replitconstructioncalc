import { Dimensions, Opening, Prices, LUMBER_DIMENSIONS, CutItem, WallElement } from "./construction-types";

export interface MaterialResults {
  total2x4Pieces: number;
  total2x6Pieces: number;
  sheetrockPieces: number;
  plywoodPieces: number; 
  shingleBundles: number;
  concreteYards: number;
  
  wallArea: number;
  totalOpeningArea: number;
  roofArea: number;
  
  cost2x4: number;
  cost2x6: number;
  costSheetrock: number;
  costPlywood: number;
  costShingles: number;
  costConcrete: number;
  totalCost: number;
  
  cutList: CutItem[];
}

export function calculateMaterials(
  dimensions: Dimensions,
  prices: Prices,
  walls: WallElement[],
  openings: Opening[]
): MaterialResults {
  const { length, width, height, studLength, roofPitch, overhang } = dimensions;
  
  const heightInches = height * 12;
  const lengthInches = length * 12;
  const widthInches = width * 12;
  const overhangInches = overhang;

  // Perimeter for Foundation/Exterior
  const perimeter = 2 * (length + width);
  
  // Wall Area: Sum of all walls (Exterior + Interior)
  // For Exterior: Perimeter * Height
  // For Interior: Length * Height * 2 (Sheetrock both sides) ?
  // Actually, let's calculate framing first.
  
  let totalWallLength = 0;
  walls.forEach(w => {
      totalWallLength += w.length;
  });
  
  const totalWallArea = totalWallLength * height;
  const ceilingArea = length * width; // Approximate ceiling area (flat)

  let totalOpeningArea = 0;
  let totalHeaderLength = 0;
  const cutList: CutItem[] = [];

  openings.forEach(opening => {
    totalOpeningArea += opening.width * opening.height;
    totalHeaderLength += opening.width + 3/12; 
  });

  // --- Material Calculation ---

  // 1. Sheetrock
  // Exterior walls (inside face only): (Perimeter * Height) - Exterior Openings
  // Interior walls (both faces): (IntLength * Height * 2) - Interior Openings
  // For simplicity, assuming all walls in `walls` list need sheetrock.
  // Note: `walls` includes exterior walls.
  // If `w.type === 'exterior'`, sheetrock 1 side.
  // If `w.type === 'interior'`, sheetrock 2 sides.
  
  let sheetrockArea = ceilingArea; // Ceiling
  
  walls.forEach(w => {
      const wArea = w.length * w.height;
      // Deduct openings on this wall
      const wallOpenings = openings.filter(o => o.wallId === w.id);
      let opArea = 0;
      wallOpenings.forEach(o => opArea += o.width * o.height);
      
      if (w.type === 'exterior') {
          sheetrockArea += (wArea - opArea);
      } else {
          sheetrockArea += (wArea - opArea) * 2;
      }
  });

  const sheetrockPieces = Math.ceil(sheetrockArea / (4 * 8)); 
  
  // 2. Foundation (Concrete Slab)
  const slabVolume = length * width * (4/12);
  const footingVolume = perimeter * 1 * 1;
  const totalConcreteCuFt = slabVolume + footingVolume;
  const concreteYards = Math.ceil((totalConcreteCuFt / 27) * 10) / 10; 

  // 3. Roof Framing
  const pitchAngle = Math.atan(roofPitch / 12);
  const run = widthInches / 2; 
  const totalRun = run + overhangInches;
  const rafterLengthInches = totalRun / Math.cos(pitchAngle);
  const rafterLengthFeet = rafterLengthInches / 12;

  const rafterSpacing = 24; 
  const raftersPerSide = Math.ceil(lengthInches / rafterSpacing) + 1;
  const totalRafters = raftersPerSide * 2;
  
  const ridgeLengthInches = lengthInches + (2 * overhangInches);

  const roofAreaSqFt = (rafterLengthFeet * (length + (2 * overhang/12))) * 2;
  
  const plywoodPieces = Math.ceil(roofAreaSqFt / 32);
  
  const shingleSquares = Math.ceil(roofAreaSqFt / 100);
  const shingleBundles = shingleSquares * 3;

  // --- Cut List Logic ---
  
  const totalPlateThickness = 1.5 * 3; 
  const commonStudLength = heightInches - totalPlateThickness;
  
  // Iterate Walls for Framing
  let total2x4Count = 0;
  
  walls.forEach(w => {
      const wLenInches = w.length * 12;
      
      // Plates
      cutList.push({
          material: '2x4',
          description: `Plates (${w.name})`,
          length: wLenInches,
          count: 3 // 1 bottom + 2 top
      });
      
      // Studs
      // Roughly 16" oc
      const studCount = Math.ceil(wLenInches / 16) + 1; // +1 for end
      // Add corner/intersection studs? Simplified.
      
      cutList.push({
          material: '2x4',
          description: `Studs (${w.name})`,
          length: commonStudLength,
          count: studCount
      });
      
      total2x4Count += (Math.ceil(wLenInches * 3 / (studLength*12))) + studCount;
  });

  // Rafters
  cutList.push({
    material: '2x6',
    description: 'Roof Rafters',
    length: rafterLengthInches,
    count: totalRafters
  });
  
  // Ridge
  cutList.push({
    material: '2x8',
    description: 'Ridge Beam',
    length: ridgeLengthInches,
    count: 1
  });

  // Ceiling Joists
  const joistCount = Math.ceil(lengthInches / 16) + 1;
  cutList.push({
    material: '2x6',
    description: 'Ceiling Joists',
    length: widthInches,
    count: joistCount
  });


  // 3. Opening Components
  let openingStudsCount = 0;
  
  openings.forEach((opening, idx) => {
      // Find wall name for label
      const parentWall = walls.find(w => w.id === opening.wallId);
      const label = `${opening.type} #${idx + 1} (${parentWall?.name || 'Unknown'})`;
      const headerLength = (opening.width * 12) + 3;
      
      cutList.push({
          material: '2x6',
          description: `Header (${label})`,
          length: headerLength,
          count: 2
      });
      
      cutList.push({
          material: '2x4',
          description: `King Studs (${label})`,
          length: commonStudLength,
          count: 2
      });
      
      const trimmerLength = ((opening.floorHeight + opening.height) * 12) - 1.5;
      cutList.push({
          material: '2x4',
          description: `Trimmers (${label})`,
          length: trimmerLength,
          count: 2
      });
      
      openingStudsCount += 4; // Rough count for estimation
  });
  
  
  // --- Final Counts ---
  
  let crippleStudsCount = 0;
  openings.forEach(opening => {
      if (opening.type === 'window') {
          const numberBelow = Math.floor(opening.width / (16/12)) + 1;
          crippleStudsCount += numberBelow;
      }
      const headerHeight = LUMBER_DIMENSIONS.header.height / 12;
      const heightRemaining = height - (opening.floorHeight + opening.height + headerHeight);
      if (heightRemaining > 0.5) {
           const numberAbove = Math.floor(opening.width / (16/12)) + 1;
           crippleStudsCount += numberAbove;
      }
  });
  
  const total2x4Pieces = total2x4Count + openingStudsCount + crippleStudsCount; // Simplified sum

  // 2x6 Lumber (Headers, Joists/Beams, Rafters)
  const header2x6Pieces = Math.ceil((totalHeaderLength / (LUMBER_DIMENSIONS.header.width / 12)) * 2);
  const ceilingJoistPieces = Math.ceil(lengthInches / 16) + 1;
  const rafterPieces = totalRafters;
  const ridgePieces = 1; 

  const total2x6Pieces = header2x6Pieces + ceilingJoistPieces + rafterPieces + ridgePieces;

  // --- Cost Calculation ---
  const cost2x4 = total2x4Pieces * prices.stud;
  const cost2x6 = total2x6Pieces * prices.beam;
  const costSheetrock = sheetrockPieces * prices.sheetrock;
  const costPlywood = plywoodPieces * prices.plywood;
  const costShingles = shingleBundles * prices.shingleSquare; 
  const costConcrete = concreteYards * prices.concrete;
  
  const totalCost = cost2x4 + cost2x6 + costSheetrock + costPlywood + costShingles + costConcrete;

  return {
    total2x4Pieces,
    total2x6Pieces,
    sheetrockPieces,
    plywoodPieces,
    shingleBundles,
    concreteYards,
    wallArea: totalWallArea,
    totalOpeningArea,
    roofArea: roofAreaSqFt,
    cost2x4,
    cost2x6,
    costSheetrock,
    costPlywood,
    costShingles,
    costConcrete,
    totalCost,
    cutList
  };
}
