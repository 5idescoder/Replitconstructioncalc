import { Dimensions, Opening, Prices, LUMBER_DIMENSIONS, CutItem } from "./construction-types";

export interface MaterialResults {
  total2x4Pieces: number;
  total2x6Pieces: number;
  sheetrockPieces: number;
  plywoodPieces: number; // Roof sheathing
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
  openings: Opening[]
): MaterialResults {
  const { length, width, height, studLength, roofPitch, overhang } = dimensions;
  
  // Convert dimensions to inches for internal calc
  const heightInches = height * 12;
  const lengthInches = length * 12;
  const widthInches = width * 12;
  const overhangInches = overhang;

  const perimeter = 2 * (length + width);
  const wallArea = perimeter * height;
  const ceilingArea = length * width;

  let totalOpeningArea = 0;
  let totalHeaderLength = 0;
  const cutList: CutItem[] = [];

  openings.forEach(opening => {
    totalOpeningArea += opening.width * opening.height;
    totalHeaderLength += opening.width + 3/12; 
  });

  // --- Material Calculation ---

  // 1. Sheetrock
  const sheetrockArea = wallArea + ceilingArea - totalOpeningArea;
  const sheetrockPieces = Math.ceil(sheetrockArea / (4 * 8)); 
  
  // 2. Foundation (Concrete Slab)
  // Volume = Length * Width * Thickness (assume 4 inches for slab)
  // + Footings? Let's keep it simple: 4" slab for the whole area + 12x12" footing perimeter
  // Slab Volume (cu ft) = (L * W * 4/12)
  const slabVolume = length * width * (4/12);
  // Footing Volume (cu ft) = Perimeter * (12/12) * (12/12) approx (1x1 ft beam)
  const footingVolume = perimeter * 1 * 1;
  const totalConcreteCuFt = slabVolume + footingVolume;
  const concreteYards = Math.ceil((totalConcreteCuFt / 27) * 10) / 10; // Round to 1 decimal place

  // 3. Roof Framing
  // Pitch: x/12. Angle = atan(x/12)
  const pitchAngle = Math.atan(roofPitch / 12);
  const run = widthInches / 2; // Half span
  const rise = run * (roofPitch / 12);
  // Rafter Line Length (hypotenuse) + Overhang
  // Overhang is horizontal run usually? Or along rafter? Usually horizontal projection.
  // So total run for rafter = run + overhang
  const totalRun = run + overhangInches;
  const rafterLengthInches = totalRun / Math.cos(pitchAngle);
  const rafterLengthFeet = rafterLengthInches / 12;

  const rafterSpacing = 24; // 24" oc common for roof
  const raftersPerSide = Math.ceil(lengthInches / rafterSpacing) + 1;
  const totalRafters = raftersPerSide * 2;
  
  const ridgeLengthInches = lengthInches + (2 * overhangInches); // Ridge spans full length + overhangs (gable end)

  // Roof Area (for decking/shingles)
  const roofAreaSqFt = (rafterLengthFeet * (length + (2 * overhang/12))) * 2;
  
  // Plywood (4x8)
  const plywoodPieces = Math.ceil(roofAreaSqFt / 32);
  
  // Shingles (1 Square = 100 sq ft. 3 Bundles per Square)
  const shingleSquares = Math.ceil(roofAreaSqFt / 100);
  const shingleBundles = shingleSquares * 3;

  // --- Cut List Logic ---
  
  const totalPlateThickness = 1.5 * 3; // 1 bottom, 2 top
  const commonStudLength = heightInches - totalPlateThickness;
  
  // Walls Studs
  let regularStudCount = Math.ceil((perimeter * 12) / 16);
  
  cutList.push({
    material: '2x4',
    description: 'Common Wall Studs',
    length: commonStudLength,
    count: regularStudCount
  });

  // Plates
  cutList.push({
    material: '2x4',
    description: 'Plates (Bottom/Top x2)',
    length: lengthInches, // Simplified for display
    count: 6 // 1 bottom + 2 top * 2 walls
  });
  cutList.push({
    material: '2x4',
    description: 'Plates (Short Walls)',
    length: widthInches,
    count: 6
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

  // Floor Joists (if not slab... but we calculated slab. Let's calculate Rim Joist for foundation perimeter visual?)
  // Let's assume Slab foundation based on user request context "Foundation" usually implying concrete in this simplified context.
  // But "Joyce's" (Joists) might imply a floor system.
  // Let's add Floor Joists to the cut list just in case, as an alternative to slab? 
  // Or maybe they meant Ceiling Joists? I already added Ceiling Joists.
  // Let's stick to Ceiling Joists for now unless they toggle Foundation type.
  // I'll treat "Foundation" as Concrete Slab and "Joists" as Ceiling Joists for this iteration.


  // 3. Opening Components
  openings.forEach((opening, idx) => {
      const label = `${opening.type} #${idx + 1}`;
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
  });
  
  
  // --- Final Counts ---
  
  const plateTotalLength = perimeter * 3;
  const plateCount = Math.ceil(plateTotalLength / studLength);
  const openingStuds = openings.length * 4; 
  
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
  
  const total2x4Pieces = Math.ceil(plateCount + openingStuds + crippleStudsCount + regularStudCount);

  // 2x6 Lumber (Headers, Joists/Beams, Rafters)
  const header2x6Pieces = Math.ceil((totalHeaderLength / (LUMBER_DIMENSIONS.header.width / 12)) * 2);
  
  // Ceiling Joists (2x6)
  const ceilingJoistPieces = Math.ceil(length / (16/12)) * Math.ceil(width / 16); // Spanning width? No, spanning shortest usually.
  // Simplified: Spanning width. Count = Length / 16"
  const ceilingJoistCount = Math.ceil(lengthInches / 16) + 1;
  
  // Rafters (2x6)
  const rafterPieces = totalRafters;

  // Ridge (2x8 - treat as 2x6 for price simplification or add beam?)
  // Let's lump Ridge into "Beam" price category (2x6/2x8)
  const ridgePieces = 1; 

  const total2x6Pieces = header2x6Pieces + ceilingJoistCount + rafterPieces + ridgePieces;

  // --- Cost Calculation ---
  const cost2x4 = total2x4Pieces * prices.stud;
  const cost2x6 = total2x6Pieces * prices.beam;
  const costSheetrock = sheetrockPieces * prices.sheetrock;
  const costPlywood = plywoodPieces * prices.plywood;
  const costShingles = shingleBundles * prices.shingleSquare; // Price per bundle
  const costConcrete = concreteYards * prices.concrete;
  
  const totalCost = cost2x4 + cost2x6 + costSheetrock + costPlywood + costShingles + costConcrete;

  return {
    total2x4Pieces,
    total2x6Pieces,
    sheetrockPieces,
    plywoodPieces,
    shingleBundles,
    concreteYards,
    wallArea,
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
