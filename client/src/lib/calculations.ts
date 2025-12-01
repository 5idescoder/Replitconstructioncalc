import { Dimensions, Opening, Prices, LUMBER_DIMENSIONS } from "./construction-types";

export interface MaterialResults {
  total2x4Pieces: number;
  total2x6Pieces: number;
  sheetrockPieces: number;
  wallArea: number;
  totalOpeningArea: number;
  cost2x4: number;
  cost2x6: number;
  costSheetrock: number;
  totalCost: number;
}

export function calculateMaterials(
  dimensions: Dimensions,
  prices: Prices,
  openings: Opening[]
): MaterialResults {
  const { length, width, height, studLength } = dimensions;

  const perimeter = 2 * (length + width);
  const wallArea = perimeter * height;
  const ceilingArea = length * width;

  let totalOpeningArea = 0;
  let totalHeaderLength = 0;

  openings.forEach(opening => {
    totalOpeningArea += opening.width * opening.height;
    totalHeaderLength += opening.width + 3/12; 
  });

  // --- Material Calculation ---

  // Sheetrock
  const sheetrockArea = wallArea + ceilingArea - totalOpeningArea;
  const sheetrockPieces = Math.ceil(sheetrockArea / (4 * 8)); 

  // 2x4 Lumber (Studs, Plates, Sills, Cripples)
  const studSpacing = 16 / 12; 
  let regularStudCount = Math.ceil(perimeter / studSpacing) * (height / studLength); 

  const openingStuds = openings.length * 4; 
  
  const plateTotalLength = perimeter * 3;
  const plateCount = Math.ceil(plateTotalLength / studLength);

  let crippleStudsCount = 0;
  openings.forEach(opening => {
      if (opening.type === 'window') {
          const crippleSpacing = 16 / 12;
          const numberBelow = Math.floor(opening.width / crippleSpacing) + 1;
          crippleStudsCount += numberBelow;
      }
      
      const headerHeight = LUMBER_DIMENSIONS.header.height / 12;
      const heightRemaining = height - (opening.floorHeight + opening.height + headerHeight);
      if (heightRemaining > 0.5) {
           const crippleSpacing = 16 / 12;
           const numberAbove = Math.floor(opening.width / crippleSpacing) + 1;
           crippleStudsCount += numberAbove;
      }
  });
  
  const total2x4Pieces = Math.ceil(plateCount + openingStuds + crippleStudsCount + regularStudCount);

  // 2x6 Lumber (Headers, Joists/Beams)

  const header2x6Pieces = Math.ceil((totalHeaderLength / (LUMBER_DIMENSIONS.header.width / 12)) * 2);

  const joistSpacing = 12 / 12; 
  const joistCount = Math.ceil(length / joistSpacing) * 2; 

  const total2x6Pieces = header2x6Pieces + joistCount;

  // --- Cost Calculation ---
  const cost2x4 = total2x4Pieces * prices.stud;
  const cost2x6 = total2x6Pieces * prices.beam;
  const costSheetrock = sheetrockPieces * prices.sheetrock;
  
  const totalCost = cost2x4 + cost2x6 + costSheetrock;

  return {
    total2x4Pieces,
    total2x6Pieces,
    sheetrockPieces,
    wallArea,
    totalOpeningArea,
    cost2x4,
    cost2x6,
    costSheetrock,
    totalCost
  };
}
