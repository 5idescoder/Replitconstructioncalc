import * as THREE from 'three';
import { Dimensions, Opening, COLORS, LUMBER_DIMENSIONS } from './construction-types';

// Helper to create lumber meshes
function createLumber(position: THREE.Vector3, rotation: THREE.Vector3, dimensions: THREE.Vector3, type: string) {
  const geometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
  const material = new THREE.MeshStandardMaterial({
    color: COLORS[type as keyof typeof COLORS] || '#808080',
    roughness: 0.8,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.setFromVector3(rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createFoundation(length: number, width: number) {
  const group = new THREE.Group();
  
  // Slab: 4 inches thick
  const slabThickness = 4 / 12; 
  const slabGeom = new THREE.BoxGeometry(length + 4/12, slabThickness, width + 4/12); // extend 2" past walls
  const slabMat = new THREE.MeshStandardMaterial({ 
    color: '#555555', 
    roughness: 0.9,
    metalness: 0.1 
  });
  const slab = new THREE.Mesh(slabGeom, slabMat);
  slab.position.set(0, -slabThickness/2, 0);
  slab.receiveShadow = true;
  group.add(slab);

  // Footing Outline (Visual only, below slab)
  // ... keep it simple, just the slab for now is good for "Foundation"
  
  return group;
}

function createRoof(dimensions: Dimensions) {
  const group = new THREE.Group();
  const { length, width, height, roofPitch, overhang } = dimensions;
  
  // Roof Parameters
  const pitchRatio = roofPitch / 12;
  const run = width / 2;
  const rise = run * pitchRatio;
  const overhangFt = overhang / 12;
  
  const wallTopY = height;
  const ridgeY = wallTopY + rise; // Peak height relative to top plate
  
  // 1. Ridge Beam
  const ridgeDepth = LUMBER_DIMENSIONS.ridge.height / 12; // 7.25" / 12
  const ridgeWidth = LUMBER_DIMENSIONS.ridge.width / 12;  // 1.5" / 12
  const ridgeLength = length + (2 * overhangFt); // Gable overhangs
  
  const ridgeMesh = createLumber(
    new THREE.Vector3(0, ridgeY - (ridgeDepth/2), 0), // Ridge sits at peak? Usually rafters sit on top or against. 
    // Standard: Rafters butt against ridge. Ridge top aligns with rafter top (roughly).
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ridgeLength, ridgeDepth, ridgeWidth),
    'ridge'
  );
  group.add(ridgeMesh);
  
  // 2. Rafters
  const rafterSpacing = 24 / 12; // 2 ft spacing
  const rafterCountPerSide = Math.ceil(length / rafterSpacing) + 1;
  
  const rafterWidth = LUMBER_DIMENSIONS.rafter.width / 12; // 1.5"
  const rafterDepth = LUMBER_DIMENSIONS.rafter.height / 12; // 5.5"
  
  // Angle of rafter
  const angle = Math.atan(pitchRatio);
  const rafterLen = (width/2 + overhangFt) / Math.cos(angle);
  
  // Create Rafters
  for (let i = 0; i < rafterCountPerSide; i++) {
      // Z position (along length)
      // Start from -length/2, distribute evenly
      // Actually, distribute based on spacing starting from one end
      let zPos = -length/2 + (i * rafterSpacing);
      if (zPos > length/2) zPos = length/2; // Clamp last one to end
      
      // Front/Back logic is X axis in our scene? 
      // In `scene-generator.ts` walls:
      // Front Wall (Z+), Back Wall (Z-). Length is along X axis?
      // Let's check Wall generation:
      // Front Wall pos: (0, h/2, width/2). Geometry Box(length, h, thick). So Length is X axis.
      
      // So Rafters span along Z axis (width), spaced along X axis (length).
      
      const xPos = -length/2 + (i * rafterSpacing);
      // Correct spacing logic:
      // Start at left edge (-length/2).
      
      // Right Side Rafters (Z+)
      // Center of rafter span is width/4 roughly?
      // Position: X = xPos. Y = midpoint of slope?
      // Let's use geometry rotation.
      // Pivot at ridge?
      
      const rafterGeo = new THREE.BoxGeometry(rafterWidth, rafterDepth, rafterLen);
      // Shift center to one end to make rotation easier? 
      // Default pivot is center.
      
      // Right Rafter (Z positive side)
      const rightRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
      // Calculate center position
      // Horizontal center = (width/4 + overhang/2) ? No.
      // It goes from Z=0 to Z=(width/2 + overhang).
      // Center Z = (width/2 + overhang)/2.
      // Y height: Starts at ridgeY, goes down.
      // Midpoint Y = ridgeY - (rise/2).
      
      // Actually, simpler to position and rotate.
      // At Z=0 (Ridge), Y=ridgeY.
      // Rotate -angle around X axis.
      
      rightRafter.rotation.x = angle;
      // Offset position to align with ridge
      // Center of rotated rafter:
      const zOffset = (width/2 + overhangFt) / 2; 
      const yOffset = (rise + (overhangFt * pitchRatio)) / 2; // Total rise including overhang
      
      rightRafter.position.set(xPos, ridgeY - yOffset, zOffset);
      group.add(rightRafter);
      
      // Left Rafter (Z negative side)
      const leftRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
      leftRafter.rotation.x = -angle;
      leftRafter.position.set(xPos, ridgeY - yOffset, -zOffset);
      group.add(leftRafter);
  }

  // 3. Ceiling Joists (Ties)
  // Span across width (Z axis), connecting top plates.
  const joistDepth = LUMBER_DIMENSIONS.joist.height / 12;
  const joistWidth = LUMBER_DIMENSIONS.joist.width / 12;
  
  for (let i = 0; i < rafterCountPerSide; i++) {
      const xPos = -length/2 + (i * rafterSpacing);
      const joist = createLumber(
          new THREE.Vector3(xPos, height + (joistDepth/2), 0),
          new THREE.Vector3(Math.PI/2, 0, 0), // Rotate to span Z
          new THREE.Vector3(joistWidth, width, joistDepth), // X=width(1.5), Y=length(span), Z=depth(5.5)
          'joist'
      );
      group.add(joist);
  }
  
  // 4. Roof Sheathing/Shingles (Visual Plane)
  const roofPlaneGeo = new THREE.PlaneGeometry(length + (2*overhangFt), rafterLen);
  const roofMat = new THREE.MeshStandardMaterial({ 
      color: '#333333', 
      side: THREE.DoubleSide,
      roughness: 0.9 
  });
  
  // Right Slope
  const rightRoof = new THREE.Mesh(roofPlaneGeo, roofMat);
  rightRoof.rotation.x = angle + (Math.PI/2); // Plane is XY, rotate to slope
  rightRoof.rotation.y = Math.PI/2; // Rotate to align length with X?
  // Wait, Plane(width, height).
  // We want Width = Length of house. Height = Rafter Length.
  // Plane is created in XY plane.
  // Rotate X = -90 (flat). Then +/- angle.
  
  // Let's construct carefully.
  // Plane aligned with slope.
  // Rotation around X axis (slope).
  
  const roofCoverRight = new THREE.Mesh(
      new THREE.BoxGeometry(length + (2*overhangFt), 0.05, rafterLen), // Thin box
      roofMat
  );
  // Center
  const zOffsetRoof = (width/2 + overhangFt) / 2;
  const yOffsetRoof = (rise + (overhangFt * pitchRatio)) / 2;
  
  roofCoverRight.position.set(0, ridgeY - yOffsetRoof + (rafterDepth/2), zOffsetRoof); // Sit on top of rafters
  roofCoverRight.rotation.x = angle;
  group.add(roofCoverRight);
  
  const roofCoverLeft = new THREE.Mesh(
      new THREE.BoxGeometry(length + (2*overhangFt), 0.05, rafterLen), 
      roofMat
  );
  roofCoverLeft.position.set(0, ridgeY - yOffsetRoof + (rafterDepth/2), -zOffsetRoof);
  roofCoverLeft.rotation.x = -angle;
  group.add(roofCoverLeft);


  return group;
}

function createOpeningFrame(opening: Opening, wallData: any, height: number) {
  const group = new THREE.Group();
  
  const { start, end, normal, wallLength } = wallData;
  
  const relativeLength = wallLength;
  const t = opening.position / relativeLength;
  const position = new THREE.Vector3().lerpVectors(start, end, t);
  
  const halfWallThickness = LUMBER_DIMENSIONS.stud.width / 24; 
  position.addScaledVector(normal, halfWallThickness);
  
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  
  // --- 1. Rough Opening (Visual Placeholder) ---
  const openingMaterial = new THREE.MeshStandardMaterial({
    color: COLORS[opening.type],
    transparent: true,
    opacity: 0.5
  });
  
  const openingGeometry = new THREE.BoxGeometry(
    opening.type === 'door' ? opening.width : opening.width + 0.5/12, 
    opening.height,
    0.25/12 
  );
  const openingMesh = new THREE.Mesh(openingGeometry, openingMaterial);
  
  openingMesh.position.copy(position);
  openingMesh.position.y = opening.floorHeight + opening.height / 2;
  
  if (normal.x !== 0) {
    openingMesh.rotation.y = Math.PI / 2;
  }
  
  group.add(openingMesh);
  
  // --- 2. Structural Framing ---
  const studDimW = LUMBER_DIMENSIONS.stud.width / 12; 
  const studDimH = LUMBER_DIMENSIONS.stud.height / 12; 
  const headerDimH = LUMBER_DIMENSIONS.header.height / 12; 
  
  // Header: Double 2x6 above opening
  const headerWidth = opening.width + 3/12; 
  
  const headerMesh = createLumber(
    new THREE.Vector3(
      position.x,
      opening.floorHeight + opening.height + headerDimH / 2,
      position.z
    ),
    new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
    new THREE.Vector3(
      headerWidth,
      headerDimH,
      LUMBER_DIMENSIONS.header.width / 12 
    ),
    'header'
  );
  group.add(headerMesh);
  
  // King Studs 
  const kingOffset = (opening.width / 2) + studDimW / 2;

  // Left King Stud
  const leftKingPos = new THREE.Vector3().copy(position).addScaledVector(direction, -kingOffset);
  const leftKingStud = createLumber(
    new THREE.Vector3(leftKingPos.x, height / 2, leftKingPos.z),
    new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
    new THREE.Vector3(studDimW, height, studDimH),
    'king'
  );
  group.add(leftKingStud);
  
  // Right King Stud
  const rightKingPos = new THREE.Vector3().copy(position).addScaledVector(direction, kingOffset);
  const rightKingStud = createLumber(
    new THREE.Vector3(rightKingPos.x, height / 2, rightKingPos.z),
    new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
    new THREE.Vector3(studDimW, height, studDimH),
    'king'
  );
  group.add(rightKingStud);
  
  // Trimmer/Jack Studs 
  const trimmerHeight = opening.floorHeight + opening.height;
  const trimmerHalfHeight = trimmerHeight / 2;
  const trimmerOffset = (opening.width / 2) + studDimW; 
  
  // Left Trimmer
  const trimmerWidthOffset = studDimW / 2;
  const leftTrimmerPos = new THREE.Vector3().copy(position).addScaledVector(direction, -trimmerOffset + trimmerWidthOffset);
  const leftTrimmer = createLumber(
    new THREE.Vector3(leftTrimmerPos.x, trimmerHalfHeight, leftTrimmerPos.z),
    new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
    new THREE.Vector3(studDimW, trimmerHeight, studDimH),
    'cripple' 
  );
  group.add(leftTrimmer);
  
  // Right Trimmer
  const rightTrimmerPos = new THREE.Vector3().copy(position).addScaledVector(direction, trimmerOffset - trimmerWidthOffset);
  const rightTrimmer = createLumber(
    new THREE.Vector3(rightTrimmerPos.x, trimmerHalfHeight, rightTrimmerPos.z),
    new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
    new THREE.Vector3(studDimW, trimmerHeight, studDimH),
    'cripple'
  );
  group.add(rightTrimmer);


  // Sill (Windows only)
  if (opening.type === 'window') {
    const sillDimH = LUMBER_DIMENSIONS.sill.height / 12;
    const sillMesh = createLumber(
      new THREE.Vector3(
        position.x,
        opening.floorHeight - sillDimH / 2,
        position.z
      ),
      new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
      new THREE.Vector3(
        opening.width + 3/12, 
        sillDimH,
        LUMBER_DIMENSIONS.sill.width / 12
      ),
      'sill'
    );
    group.add(sillMesh);
    
    // Cripple Studs below window
    const crippleSpacing = 16 / 12;
    const crippleCount = Math.floor(opening.width / crippleSpacing) + 1; 
    const crippleHeight = opening.floorHeight - sillDimH;
    
    if (crippleHeight > 0) {
      for (let i = 0; i < crippleCount; i++) {
        const crippleCenter = (i + 0.5) * crippleSpacing - opening.width / 2;
        const cripplePos = new THREE.Vector3().copy(position).addScaledVector(direction, crippleCenter);
        
        const crippleStud = createLumber(
          new THREE.Vector3(
            cripplePos.x,
            crippleHeight / 2 + studDimH/2, 
            cripplePos.z
          ),
          new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
          new THREE.Vector3(studDimW, crippleHeight - studDimH/2, studDimH),
          'cripple'
        );
        group.add(crippleStud);
      }
    }
  }
  
  // Cripple Studs above the opening (between header and top plate)
  const heightRemaining = height - (trimmerHeight + headerDimH);
  const topCrippleHalfHeight = trimmerHeight + headerDimH + heightRemaining / 2;
  
  if (heightRemaining > 0.5) { 
    const topCrippleSpacing = 16 / 12;
    const topCrippleCount = Math.floor(opening.width / topCrippleSpacing) + 1; 
    
    for (let i = 0; i < topCrippleCount; i++) {
      const crippleCenter = (i + 0.5) * topCrippleSpacing - opening.width / 2;
      const cripplePos = new THREE.Vector3().copy(position).addScaledVector(direction, crippleCenter);
      
      const crippleStud = createLumber(
        new THREE.Vector3(
          cripplePos.x,
          topCrippleHalfHeight,
          cripplePos.z
        ),
        new THREE.Vector3(0, normal.x !== 0 ? Math.PI / 2 : 0, 0),
        new THREE.Vector3(studDimW, heightRemaining, studDimH),
        'cripple'
      );
      group.add(crippleStud);
    }
  }
  
  return group;
}

function createFraming(length: number, width: number, height: number) {
  const group = new THREE.Group();
  const studSpacing = 16 / 12; 
  const studDimW = LUMBER_DIMENSIONS.stud.width / 12;
  const studDimH = LUMBER_DIMENSIONS.stud.height / 12;
  const plateDimH = LUMBER_DIMENSIONS.plate.height / 12;
  
  const plateHalfW = LUMBER_DIMENSIONS.plate.width / 24; 
  
  // Corner positions for initial studs
  const cornerPositions = [
    { x: length / 2 - plateHalfW, z: width / 2 - plateHalfW, angle: 0 },
    { x: -length / 2 + plateHalfW, z: width / 2 - plateHalfW, angle: 0 },
    { x: length / 2 - plateHalfW, z: -width / 2 + plateHalfW, angle: 0 },
    { x: -length / 2 + plateHalfW, z: -width / 2 + plateHalfW, angle: 0 }
  ];

  // --- Vertical Studs (Including Corners) ---
  const studs = [];
  const plateHalfH = plateDimH / 2;
  const studHeight = height - plateDimH * 2; // Height minus top/bottom plates

  // Long walls (Front/Back)
  for (let x = -length / 2; x <= length / 2; x += studSpacing) {
    if (Math.abs(x) < length / 2) {
        studs.push({ x: x, z: width / 2 - plateHalfW, angle: 0 });
        studs.push({ x: x, z: -width / 2 + plateHalfW, angle: 0 });
    }
  }
  
  // Short walls (Left/Right)
  for (let z = -width / 2; z <= width / 2; z += studSpacing) {
    if (Math.abs(z) < width / 2) {
        studs.push({ x: length / 2 - plateHalfW, z: z, angle: Math.PI / 2 });
        studs.push({ x: -length / 2 + plateHalfW, z: z, angle: Math.PI / 2 });
    }
  }

  // Add Corner Studs 
  cornerPositions.forEach(pos => {
    // Stud 1: oriented for the long wall
    group.add(createLumber(
      new THREE.Vector3(pos.x, plateDimH + studHeight / 2, pos.z),
      new THREE.Vector3(0, pos.angle, 0),
      new THREE.Vector3(studDimW, studHeight, studDimH), 
      'stud'
    ));
    // Stud 2: oriented for the short wall
    group.add(createLumber(
      new THREE.Vector3(pos.x, plateDimH + studHeight / 2, pos.z),
      new THREE.Vector3(0, pos.angle + Math.PI / 2, 0),
      new THREE.Vector3(studDimW, studHeight, studDimH),
      'stud'
    ));
  });

  // Add regular studs (excluding corners to avoid overlap)
  studs.forEach(stud => {
      group.add(createLumber(
        new THREE.Vector3(stud.x, plateDimH + studHeight / 2, stud.z),
        new THREE.Vector3(0, stud.angle, 0),
        new THREE.Vector3(studDimW, studHeight, studDimH),
        'stud'
      ));
  });

  // --- Horizontal Plates ---
  
  // Bottom Plate (Single)
  group.add(createLumber(
    new THREE.Vector3(0, plateHalfH, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length, plateDimH, LUMBER_DIMENSIONS.plate.width / 12),
    'plate'
  ));

  // Top Plates (Double)
  for (let i = 0; i < 2; i++) {
      const yPos = height - plateHalfH - (i * plateDimH);
      group.add(createLumber(
          new THREE.Vector3(0, yPos, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(length, plateDimH, LUMBER_DIMENSIONS.plate.width / 12),
          'plate'
      ));
  }

  // Side Plates (Added to complete the perimeter visual on top/bottom)
  // Right Side Plate
  group.add(createLumber(
    new THREE.Vector3(length / 2, height / 2, 0),
    new THREE.Vector3(0, Math.PI / 2, 0),
    new THREE.Vector3(width, plateDimH, LUMBER_DIMENSIONS.plate.width / 12),
    'plate'
  ));

  // Left Side Plate
  group.add(createLumber(
    new THREE.Vector3(-length / 2, height / 2, 0),
    new THREE.Vector3(0, Math.PI / 2, 0),
    new THREE.Vector3(width, plateDimH, LUMBER_DIMENSIONS.plate.width / 12),
    'plate'
  ));

  return group;
}

export function generateSceneGroup(dimensions: Dimensions, openings: Opening[]) {
  const group = new THREE.Group();
  const { length, width, height } = dimensions;
  const wallThickness = LUMBER_DIMENSIONS.stud.width / 12; 
  const wallHeight = height;

  // --- Exterior Shell (Translucent for visualization) ---
  // Make walls semi-transparent to see framing
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: '#808080',
    transparent: true,
    opacity: 0.05, // Very transparent
    side: THREE.DoubleSide
  });

  // Walls
  const walls = [
    { geometry: new THREE.BoxGeometry(length, wallHeight, wallThickness), position: new THREE.Vector3(0, wallHeight / 2, width / 2 + wallThickness / 2), rotation: 0 }, 
    { geometry: new THREE.BoxGeometry(length, wallHeight, wallThickness), position: new THREE.Vector3(0, wallHeight / 2, -width / 2 - wallThickness / 2), rotation: 0 }, 
    { geometry: new THREE.BoxGeometry(width, wallHeight, wallThickness), position: new THREE.Vector3(length / 2 + wallThickness / 2, wallHeight / 2, 0), rotation: Math.PI / 2 }, 
    { geometry: new THREE.BoxGeometry(width, wallHeight, wallThickness), position: new THREE.Vector3(-length / 2 - wallThickness / 2, wallHeight / 2, 0), rotation: Math.PI / 2 }  
  ];

  walls.forEach(w => {
    const mesh = new THREE.Mesh(w.geometry, wallMaterial);
    mesh.position.copy(w.position);
    mesh.rotation.y = w.rotation;
    group.add(mesh);
  });

  // Floor (Opaque) - replaced by Foundation
  // const floorGeometry = new THREE.BoxGeometry(length, wallThickness, width);
  // const floorMaterial = new THREE.MeshStandardMaterial({ color: '#404040' });
  // const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  // floorMesh.position.set(0, -wallThickness / 2, 0);
  // group.add(floorMesh);
  group.add(createFoundation(length, width));

  // Roof
  group.add(createRoof(dimensions));

  // --- Framing and Openings ---
  openings.forEach(opening => {
    let simplifiedWallData;
    switch (opening.wall) {
        case 'front':
        case 'back':
            simplifiedWallData = {
                start: new THREE.Vector3(-length / 2, 0, opening.wall === 'front' ? width / 2 : -width / 2),
                end: new THREE.Vector3(length / 2, 0, opening.wall === 'front' ? width / 2 : -width / 2),
                normal: new THREE.Vector3(0, 0, opening.wall === 'front' ? 1 : -1),
                wallLength: length
            };
            break;
        case 'right':
        case 'left':
            simplifiedWallData = {
                start: new THREE.Vector3(opening.wall === 'right' ? length / 2 : -length / 2, 0, -width / 2),
                end: new THREE.Vector3(opening.wall === 'right' ? length / 2 : -length / 2, 0, width / 2),
                normal: new THREE.Vector3(opening.wall === 'right' ? 1 : -1, 0, 0),
                wallLength: width
            };
            break;
    }

    if (simplifiedWallData) {
        const openingFrame = createOpeningFrame(opening, simplifiedWallData, height);
        group.add(openingFrame);
    }
  });

  const framing = createFraming(length, width, height);
  group.add(framing);

  return group;
}
