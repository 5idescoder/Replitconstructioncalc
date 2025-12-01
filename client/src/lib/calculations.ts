import { Dimensions, Opening, Prices, LUMBER_DIMENSIONS, CutItem } from "./construction-types";

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
  cutList: CutItem[];
}

export function calculateMaterials(
  dimensions: Dimensions,
  prices: Prices,
  openings: Opening[]
): MaterialResults {
  const { length, width, height, studLength } = dimensions;
  
  // Convert dimensions to inches for internal calc
  const heightInches = height * 12;
  const lengthInches = length * 12;
  const widthInches = width * 12;

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

  // Sheetrock
  const sheetrockArea = wallArea + ceilingArea - totalOpeningArea;
  const sheetrockPieces = Math.ceil(sheetrockArea / (4 * 8)); 
  
  // --- Cut List Logic ---
  
  const studDimW = LUMBER_DIMENSIONS.stud.width; // 1.5
  const studDimH = LUMBER_DIMENSIONS.stud.height; // 3.5
  const plateDimH = LUMBER_DIMENSIONS.plate.height; // 1.5 (actually plate usually 1.5 thick flat)
  // NOTE: In the original code/types, plate height is listed as 3.5, but plates are usually laid flat (1.5 high).
  // However, for consistency with the visualizer which might use these dimensions:
  // The visualizer uses `plateDimH` from `LUMBER_DIMENSIONS.plate.height / 12`. 
  // If `LUMBER_DIMENSIONS.plate.height` is 3.5, that's a 2x4 on edge? 
  // Standard construction: Bottom plate (1.5), Top Plate (1.5), Double Top Plate (1.5).
  // The visualizer uses `plateDimH` for Y positioning.
  // Let's assume standard platform framing: 3 plates total (1 bottom, 2 top) = 4.5 inches of plates.
  const totalPlateThickness = 1.5 * 3; // 1 bottom, 2 top
  
  // 1. Common Studs
  // Height of stud = Wall Height - (3 * 1.5)
  const commonStudLength = heightInches - totalPlateThickness;
  
  const studSpacing = 16; // inches
  const perimeterInches = perimeter * 12;
  // Rough estimate of common studs: perimeter / 16
  let regularStudCount = Math.ceil(perimeterInches / studSpacing);
  
  // Deduct studs that are replaced by openings (roughly)
  // For each opening, we lose some common studs but gain king/jack studs.
  // Let's just list the calculated full studs.
  
  cutList.push({
    material: '2x4',
    description: 'Common Wall Studs',
    length: commonStudLength,
    count: regularStudCount
  });

  // 2. Plates
  // Top plates and bottom plates.
  // Total length of plates = Perimeter * 3
  // We usually buy them in standard lengths (e.g., 16ft) but here we just list the total linear footage or segments.
  // Let's list them as "Plate Run" for now, effectively matching the wall lengths.
  // Front/Back walls: length
  // Side walls: width - (2 * wallThickness) ... roughly
  cutList.push({
    material: '2x4',
    description: 'Bottom Plates (Long Walls)',
    length: lengthInches,
    count: 2
  });
   cutList.push({
    material: '2x4',
    description: 'Bottom Plates (Short Walls)',
    length: widthInches - (2 * 3.5), // Subtracting wall thickness overlaps roughly
    count: 2
  });
  // Top Plates (doubled)
  cutList.push({
    material: '2x4',
    description: 'Top Plates (Long Walls)',
    length: lengthInches,
    count: 4
  });
  cutList.push({
    material: '2x4',
    description: 'Top Plates (Short Walls)',
    length: widthInches - (2 * 3.5),
    count: 4
  });


  // 3. Opening Components
  openings.forEach((opening, idx) => {
      const opWidthInches = opening.width * 12;
      const opHeightInches = opening.height * 12;
      const floorHeightInches = opening.floorHeight * 12;
      
      const label = `${opening.type} #${idx + 1} (${opening.width}'x${opening.height}')`;
      
      // Headers (2x6 usually doubled)
      const headerLength = opWidthInches + 3; // Width + 2 trimmers (1.5 each)
      cutList.push({
          material: '2x6',
          description: `Header (${label})`,
          length: headerLength,
          count: 2
      });
      
      // King Studs (Full Height)
      cutList.push({
          material: '2x4',
          description: `King Studs (${label})`,
          length: commonStudLength,
          count: 2
      });
      
      // Trimmer/Jack Studs
      // Height = Header Height (from floor) - Bottom Plate
      // Header Height from floor = floorHeight + opHeight
      // Trimmer Length = (floorHeight + opHeight) - 1.5 (bottom plate)
      const trimmerLength = (floorHeightInches + opHeightInches) - 1.5;
      cutList.push({
          material: '2x4',
          description: `Trimmer/Jack Studs (${label})`,
          length: trimmerLength,
          count: 2
      });
      
      // Sills (Windows only)
      if (opening.type === 'window') {
          cutList.push({
              material: '2x4',
              description: `Rough Sill (${label})`,
              length: opWidthInches,
              count: 1
          });
          
          // Cripples Below
          // Length = Floor Height - Bottom Plate (1.5) - Sill Plate (1.5)
          const crippleBelowLength = floorHeightInches - 3;
          if (crippleBelowLength > 0) {
              const numCripples = Math.ceil(opWidthInches / 16);
              cutList.push({
                  material: '2x4',
                  description: `Cripples Below (${label})`,
                  length: crippleBelowLength,
                  count: numCripples
              });
          }
      }
      
      // Cripples Above
      // Length = Wall Height - (Header Top Height) - Top Plates (3.0)
      // Header Top Height = floorHeight + opHeight + HeaderDepth (5.5 for 2x6)
      const headerTopHeight = floorHeightInches + opHeightInches + 5.5;
      const crippleAboveLength = heightInches - headerTopHeight - 3.0; // 3.0 for double top plate
      
      if (crippleAboveLength > 0) {
          const numCripples = Math.ceil(opWidthInches / 16);
           cutList.push({
                  material: '2x4',
                  description: `Cripples Above (${label})`,
                  length: crippleAboveLength,
                  count: numCripples
              });
      }
  });
  
  // Joists
  const joistCount = Math.ceil(length / (12/12)) * 2; // original logic kept
  cutList.push({
      material: '2x6',
      description: 'Ceiling Joists',
      length: widthInches, // Spanning the width
      count: Math.ceil(lengthInches / 16) // 16oc spacing usually
  });


  // --- Consolidated Counts for Original Output ---
  // 2x4 Lumber (Studs, Plates, Sills, Cripples)
  // Re-using the simpler logic for the "Total Pieces" estimation to avoid regression,
  // as the cut list is more granular and might sum up differently.
  
  const plateTotalLength = perimeter * 3;
  const plateCount = Math.ceil(plateTotalLength / studLength);
  const openingStuds = openings.length * 4; 
  
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
  
  let regularStudCountSimple = Math.ceil(perimeter / (16/12)) * (height / studLength); 
  const total2x4Pieces = Math.ceil(plateCount + openingStuds + crippleStudsCount + regularStudCountSimple);

  // 2x6 Lumber (Headers, Joists/Beams)
  const header2x6Pieces = Math.ceil((totalHeaderLength / (LUMBER_DIMENSIONS.header.width / 12)) * 2);
  const joistCountSimple = Math.ceil(length / (12/12)) * 2; 
  const total2x6Pieces = header2x6Pieces + joistCountSimple;

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
    totalCost,
    cutList
  };
}
