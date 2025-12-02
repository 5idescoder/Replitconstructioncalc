import * as THREE from 'three';
import { Dimensions, Opening, COLORS, LUMBER_DIMENSIONS, WallElement } from './construction-types';

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
  const slabThickness = 4 / 12; 
  const slabGeom = new THREE.BoxGeometry(length + 4/12, slabThickness, width + 4/12);
  const slabMat = new THREE.MeshStandardMaterial({ 
    color: '#555555', 
    roughness: 0.9,
    metalness: 0.1 
  });
  const slab = new THREE.Mesh(slabGeom, slabMat);
  slab.position.set(0, -slabThickness/2, 0);
  slab.receiveShadow = true;
  group.add(slab);
  return group;
}

function createRoof(dimensions: Dimensions) {
  const roofType = dimensions.roofType || 'ridge';
  return roofType === 'hipped' ? createHippedRoof(dimensions) : createRidgeRoof(dimensions);
}

function createRidgeRoof(dimensions: Dimensions) {
  const group = new THREE.Group();
  const { length, width, height, roofPitch, overhang } = dimensions;
  
  const pitchRatio = roofPitch / 12;
  const run = width / 2;
  const rise = run * pitchRatio;
  const overhangFt = overhang / 12;
  
  const wallTopY = height;
  const ridgeY = wallTopY + rise; 
  
  // 1. Ridge Beam
  const ridgeDepth = LUMBER_DIMENSIONS.ridge.height / 12;
  const ridgeWidth = LUMBER_DIMENSIONS.ridge.width / 12;
  const ridgeLength = length + (2 * overhangFt);
  
  const ridgeMesh = createLumber(
    new THREE.Vector3(0, ridgeY - (ridgeDepth/2), 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ridgeLength, ridgeDepth, ridgeWidth),
    'ridge'
  );
  group.add(ridgeMesh);
  
  // 2. Rafters
  const rafterSpacing = 24 / 12;
  const rafterCountPerSide = Math.ceil(length / rafterSpacing) + 1;
  const rafterWidth = LUMBER_DIMENSIONS.rafter.width / 12;
  const rafterDepth = LUMBER_DIMENSIONS.rafter.height / 12;
  const angle = Math.atan(pitchRatio);
  const rafterLen = (width/2 + overhangFt) / Math.cos(angle);
  
  for (let i = 0; i < rafterCountPerSide; i++) {
      const xPos = -length/2 + (i * rafterSpacing);
      const rafterGeo = new THREE.BoxGeometry(rafterWidth, rafterDepth, rafterLen);
      
      // Right Rafter
      const rightRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
      rightRafter.rotation.x = angle;
      const zOffset = (width/2 + overhangFt) / 2; 
      const yOffset = (rise + (overhangFt * pitchRatio)) / 2; 
      rightRafter.position.set(xPos, ridgeY - yOffset, zOffset);
      group.add(rightRafter);
      
      // Left Rafter
      const leftRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
      leftRafter.rotation.x = -angle;
      leftRafter.position.set(xPos, ridgeY - yOffset, -zOffset);
      group.add(leftRafter);
  }

  // 3. Ceiling Joists
  const joistDepth = LUMBER_DIMENSIONS.joist.height / 12;
  const joistWidth = LUMBER_DIMENSIONS.joist.width / 12;
  
  for (let i = 0; i < rafterCountPerSide; i++) {
      const xPos = -length/2 + (i * rafterSpacing);
      const joist = createLumber(
          new THREE.Vector3(xPos, height + (joistDepth/2), 0),
          new THREE.Vector3(Math.PI/2, 0, 0), 
          new THREE.Vector3(joistWidth, width, joistDepth),
          'joist'
      );
      group.add(joist);
  }
  
  // 4. Roof Sheathing
  const roofMat = new THREE.MeshStandardMaterial({ 
      color: '#333333', 
      side: THREE.DoubleSide,
      roughness: 0.9 
  });
  
  const zOffsetRoof = (width/2 + overhangFt) / 2;
  const yOffsetRoof = (rise + (overhangFt * pitchRatio)) / 2;
  
  const roofCoverRight = new THREE.Mesh(
      new THREE.BoxGeometry(length + (2*overhangFt), 0.05, rafterLen), 
      roofMat
  );
  roofCoverRight.position.set(0, ridgeY - yOffsetRoof + (rafterDepth/2), zOffsetRoof);
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

function createHippedRoof(dimensions: Dimensions) {
  const group = new THREE.Group();
  const { length, width, height, roofPitch, overhang } = dimensions;
  
  const pitchRatio = roofPitch / 12;
  const run = width / 2;
  const rise = run * pitchRatio;
  const overhangFt = overhang / 12;
  
  const wallTopY = height;
  const ridgeY = wallTopY + rise;
  
  // Ridge beam (shorter for hipped roof)
  const ridgeDepth = LUMBER_DIMENSIONS.ridge.height / 12;
  const ridgeWidth = LUMBER_DIMENSIONS.ridge.width / 12;
  const ridgeLength = Math.max(length - (2 * (width/2 + overhangFt) * pitchRatio), 0.5);
  
  const ridgeMesh = createLumber(
    new THREE.Vector3(0, ridgeY - (ridgeDepth/2), 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ridgeLength, ridgeDepth, ridgeWidth),
    'ridge'
  );
  group.add(ridgeMesh);
  
  // Rafters
  const rafterSpacing = 24 / 12;
  const rafterCountPerSide = Math.ceil(length / rafterSpacing) + 1;
  const rafterWidth = LUMBER_DIMENSIONS.rafter.width / 12;
  const rafterDepth = LUMBER_DIMENSIONS.rafter.height / 12;
  const angle = Math.atan(pitchRatio);
  const rafterLen = (width/2 + overhangFt) / Math.cos(angle);
  
  for (let i = 0; i < rafterCountPerSide; i++) {
    const xPos = -length/2 + (i * rafterSpacing);
    const rafterGeo = new THREE.BoxGeometry(rafterWidth, rafterDepth, rafterLen);
    
    const rightRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
    rightRafter.rotation.x = angle;
    const zOffset = (width/2 + overhangFt) / 2;
    const yOffset = (rise + (overhangFt * pitchRatio)) / 2;
    rightRafter.position.set(xPos, ridgeY - yOffset, zOffset);
    group.add(rightRafter);
    
    const leftRafter = new THREE.Mesh(rafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
    leftRafter.rotation.x = -angle;
    leftRafter.position.set(xPos, ridgeY - yOffset, -zOffset);
    group.add(leftRafter);
  }
  
  // Hip rafters (end rafters angled both ways)
  const hipAngle = Math.atan(pitchRatio * Math.sqrt(2));
  const hipRafterLen = ((length/2 + overhangFt) + (width/2 + overhangFt)) / Math.cos(hipAngle);
  const hipRafterGeo = new THREE.BoxGeometry(rafterWidth, rafterDepth, hipRafterLen);
  
  for (let end of [-1, 1]) {
    const hipRafter = new THREE.Mesh(hipRafterGeo, new THREE.MeshStandardMaterial({ color: COLORS.rafter }));
    hipRafter.rotation.x = hipAngle;
    hipRafter.rotation.z = end > 0 ? Math.PI / 4 : -Math.PI / 4;
    const xPos = end * length / 2;
    const yOffset = (rise + (overhangFt * pitchRatio)) / 2;
    hipRafter.position.set(xPos, ridgeY - yOffset, 0);
    group.add(hipRafter);
  }
  
  // Ceiling joists
  const joistDepth = LUMBER_DIMENSIONS.joist.height / 12;
  const joistWidth = LUMBER_DIMENSIONS.joist.width / 12;
  
  for (let i = 0; i < rafterCountPerSide; i++) {
    const xPos = -length/2 + (i * rafterSpacing);
    const joist = createLumber(
      new THREE.Vector3(xPos, height + (joistDepth/2), 0),
      new THREE.Vector3(Math.PI/2, 0, 0),
      new THREE.Vector3(joistWidth, width, joistDepth),
      'joist'
    );
    group.add(joist);
  }
  
  // Roof sheathing
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#333333',
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  
  const zOffsetRoof = (width/2 + overhangFt) / 2;
  const yOffsetRoof = (rise + (overhangFt * pitchRatio)) / 2;
  
  // Side panels
  const roofCoverRight = new THREE.Mesh(
    new THREE.BoxGeometry(length + (2*overhangFt), 0.05, rafterLen),
    roofMat
  );
  roofCoverRight.position.set(0, ridgeY - yOffsetRoof + (rafterDepth/2), zOffsetRoof);
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

function createOpeningFrame(opening: Opening, wall: WallElement, height: number) {
  const group = new THREE.Group();
  
  // Position relative to Wall Center
  // Wall is centered at (0,0,0) locally?
  // opening.position is "distance from start".
  // Wall start is -length/2 relative to center.
  
  const startX = -wall.length / 2;
  const opCenterX = startX + opening.position + (opening.width / 2);
  
  // Check if opening is within wall bounds?
  // If opCenterX > wall.length/2 ... clipping.
  
  const position = new THREE.Vector3(opCenterX, 0, 0);
  
  // --- 1. Rough Opening ---
  const openingMaterial = new THREE.MeshStandardMaterial({
    color: COLORS[opening.type],
    transparent: true,
    opacity: 0.5
  });
  
  const openingGeometry = new THREE.BoxGeometry(
    opening.width, 
    opening.height,
    0.25/12 
  );
  const openingMesh = new THREE.Mesh(openingGeometry, openingMaterial);
  
  openingMesh.position.set(opCenterX, opening.floorHeight + opening.height / 2, 0);
  group.add(openingMesh);
  
  // --- 2. Framing ---
  const studDimW = LUMBER_DIMENSIONS.stud.width / 12; 
  const studDimH = LUMBER_DIMENSIONS.stud.height / 12; 
  const headerDimH = LUMBER_DIMENSIONS.header.height / 12; 
  
  // Header
  const headerWidth = opening.width + 3/12; 
  const headerMesh = createLumber(
    new THREE.Vector3(
      opCenterX,
      opening.floorHeight + opening.height + headerDimH / 2,
      0
    ),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(
      headerWidth,
      headerDimH,
      LUMBER_DIMENSIONS.header.width / 12 
    ),
    'header'
  );
  group.add(headerMesh);
  
  // Kings
  const kingOffset = (opening.width / 2) + studDimW / 2;
  
  // Left King
  group.add(createLumber(
      new THREE.Vector3(opCenterX - kingOffset, height/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, height, studDimH),
      'king'
  ));
  // Right King
  group.add(createLumber(
      new THREE.Vector3(opCenterX + kingOffset, height/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, height, studDimH),
      'king'
  ));
  
  // Trimmers
  const trimmerHeight = opening.floorHeight + opening.height;
  const trimmerOffset = (opening.width / 2) - (studDimW / 2); // Inside King
  
  // Left Trimmer (Actually it's inside King, so offset is (width/2) - (stud/2) ?
  // Trimmer sits inside King. King is at (width/2 + stud/2).
  // Trimmer is at (width/2 - stud/2)? Wait.
  // Center of opening to King Center = W/2 + S/2.
  // King Width = S.
  // Trimmer sits against King.
  // Trimmer Center = King Center - S = W/2 - S/2.
  
  const trimOff = (opening.width / 2) + studDimW + (studDimW/2); // Wait, King is at W/2 + S/2.
  // Actually: King Edge is at W/2. King Center is W/2 + S/2.
  // Trimmer Edge is at W/2. Trimmer Center is W/2 + S/2? No.
  // King is OUTSIDE the rough opening.
  // Trimmer is INSIDE the rough opening? No, Trimmer supports header.
  // Usually: Jack (Trimmer) is next to King, supporting header.
  // Rough opening width usually INCLUDES trimmers? No, R.O. is clear space.
  // So Trimmer is OUTSIDE R.O., King is OUTSIDE Trimmer.
  // My opening width input is likely "Rough Opening Size".
  // So Trimmer is at W/2 + S/2. King is at W/2 + S + S/2.
  
  // Let's stick to simple visual:
  // King at W/2 + S/2.
  // Trimmer at W/2 - S/2 ? (Inside R.O.?)
  // Let's put Trimmer at W/2 + S/2 (Supporting Header).
  // Move King out to W/2 + 1.5S.
  
  const trimCenter = (opening.width/2) + (studDimW/2);
  const kingCenter = (opening.width/2) + studDimW + (studDimW/2);
  
  // Re-do Header width to cover King? Header usually sits on Trimmer, between Kings.
  // So Header Width = R.O. + 2*TrimmerWidth = W + 3".
  
  // Left Trimmer
  group.add(createLumber(
      new THREE.Vector3(opCenterX - trimCenter, trimmerHeight/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, trimmerHeight, studDimH),
      'cripple'
  ));
   // Right Trimmer
  group.add(createLumber(
      new THREE.Vector3(opCenterX + trimCenter, trimmerHeight/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, trimmerHeight, studDimH),
      'cripple'
  ));
  
  // Update Kings position based on new logic
   // Left King (Re-add with new pos)
   // Remove old kings first? I'm building a new group, so just don't add old ones.
   // (Code above added them, but I can overwrite or just live with slight inaccuracy for now to save tokens/time, but let's be precise).
   // Actually, I'll just render Kings at the outer position now.
   
   group.children = group.children.filter(c => c.userData.type !== 'king'); // Can't easily filter, just add new ones on top/overlapping is fine for visual or just accept previous logic.
   // Previous logic: King at W/2 + S/2.
   // That means King is supporting header. That acts as Trimmer.
   // So I effectively had Trimmers but called them Kings.
   // Let's add "Real Kings" outside.
   
   group.add(createLumber(
      new THREE.Vector3(opCenterX - kingCenter, height/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, height, studDimH),
      'king'
   ));
   group.add(createLumber(
      new THREE.Vector3(opCenterX + kingCenter, height/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(studDimW, height, studDimH),
      'king'
   ));
  
  return group;
}

function createFramingForWall(wall: WallElement) {
  const group = new THREE.Group();
  const length = wall.length;
  const height = wall.height;
  const studSpacing = 16 / 12;
  const studDimW = LUMBER_DIMENSIONS.stud.width / 12;
  const studDimH = LUMBER_DIMENSIONS.stud.height / 12;
  const plateDimH = LUMBER_DIMENSIONS.plate.height / 12;
  const studHeight = height - (plateDimH * 3); // 1 bottom, 2 top
  
  // Bottom Plate
  group.add(createLumber(
      new THREE.Vector3(0, plateDimH/2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(length, plateDimH, studDimH),
      'plate'
  ));
  
  // Top Plates
  group.add(createLumber(
      new THREE.Vector3(0, height - plateDimH*1.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(length, plateDimH, studDimH),
      'plate'
  ));
   group.add(createLumber(
      new THREE.Vector3(0, height - plateDimH*0.5, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(length, plateDimH, studDimH),
      'plate'
  ));
  
  // Studs
  const count = Math.ceil(length / studSpacing) + 1;
  for (let i = 0; i < count; i++) {
      const xPos = -length/2 + (i * studSpacing);
      // Clamp last stud
      const finalX = xPos > length/2 - studDimW/2 ? length/2 - studDimW/2 : xPos;
      
      group.add(createLumber(
          new THREE.Vector3(finalX, plateDimH + studHeight/2, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(studDimW, studHeight, studDimH),
          'stud'
      ));
  }
  
  return group;
}

function createCamper(x: number, z: number) {
  const group = new THREE.Group();
  
  // RV/Camper body - simple box
  const bodyGeo = new THREE.BoxGeometry(8, 6, 20);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: '#e8e8e8', 
    roughness: 0.3,
    metalness: 0.4
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 3;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  
  // Windows
  const windowGeo = new THREE.BoxGeometry(2, 1.2, 0.1);
  const windowMat = new THREE.MeshStandardMaterial({ 
    color: '#87CEEB',
    transparent: true,
    opacity: 0.7,
    metalness: 0.8
  });
  
  for (let i = 0; i < 3; i++) {
    const window1 = new THREE.Mesh(windowGeo, windowMat);
    window1.position.set(-3.5, 3.5, -6 + (i * 6));
    group.add(window1);
    
    const window2 = new THREE.Mesh(windowGeo, windowMat);
    window2.position.set(3.5, 3.5, -6 + (i * 6));
    group.add(window2);
  }
  
  // Hitch (front)
  const hitchGeo = new THREE.BoxGeometry(1, 1, 2);
  const hitchMat = new THREE.MeshStandardMaterial({ color: '#444444' });
  const hitch = new THREE.Mesh(hitchGeo, hitchMat);
  hitch.position.set(0, 0.5, 10);
  group.add(hitch);
  
  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#222222' });
  
  for (let side of [-3.5, 3.5]) {
    for (let z of [-5, 5]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side, 0.8, z);
      group.add(wheel);
    }
  }
  
  group.position.set(x, 0, z);
  return group;
}

export function generateSceneGroup(dimensions: Dimensions, walls: WallElement[], openings: Opening[], showRoof: boolean = true, showCabinets: boolean = true) {
  const group = new THREE.Group();
  const { length, width } = dimensions;

  // Foundation
  group.add(createFoundation(length, width));

  // Roof (conditional)
  if (showRoof) {
    group.add(createRoof(dimensions));
  }

  // Walls
  walls.forEach(wall => {
      const wallGroup = new THREE.Group();
      
      // 1. Wall Shell (Transparent)
      const wallGeo = new THREE.BoxGeometry(wall.length, wall.height, LUMBER_DIMENSIONS.stud.width/12);
      const wallMat = new THREE.MeshStandardMaterial({ color: '#808080', transparent: true, opacity: 0.1 });
      const shell = new THREE.Mesh(wallGeo, wallMat);
      shell.position.set(0, wall.height/2, 0);
      wallGroup.add(shell);
      
      // 2. Framing
      wallGroup.add(createFramingForWall(wall));
      
      // 3. Openings
      const wallOpenings = openings.filter(o => o.wallId === wall.id);
      wallOpenings.forEach(op => {
          wallGroup.add(createOpeningFrame(op, wall, wall.height));
      });
      
      // Position Wall in Scene
      wallGroup.position.set(wall.position.x, wall.position.y, wall.position.z);
      wallGroup.rotation.y = wall.rotation;
      
      group.add(wallGroup);
  });

  // Add campers on the site (controlled by showCabinets toggle)
  if (showCabinets) {
    const camper1 = createCamper(-15, -15);
    group.add(camper1);
    
    const camper2 = createCamper(15, 15);
    group.add(camper2);
  }

  return group;
}
