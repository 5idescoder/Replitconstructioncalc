import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Dimensions, Opening } from "@/lib/construction-types";
import { generateSceneGroup } from "@/lib/scene-generator";

interface ScenePreviewProps {
  dimensions: Dimensions;
  openings: Opening[];
}

export default function ScenePreview({ dimensions, openings }: ScenePreviewProps) {
  // Re-generate the scene group whenever dimensions or openings change
  const sceneGroup = useMemo(() => {
    return generateSceneGroup(dimensions, openings);
  }, [dimensions, openings]);

  // Cleanup resources when sceneGroup changes to prevent memory leaks
  useEffect(() => {
    return () => {
      sceneGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [sceneGroup]);

  return (
    <div className="w-full h-full min-h-[400px] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 shadow-inner relative">
      <Canvas camera={{ position: [30, 20, 30], fov: 50 }} shadows>
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 30, 150]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <group position={[0, 0, 0]}>
          <primitive object={sceneGroup} />
          
          {/* Ground plane for shadows */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.4} />
          </mesh>
        </group>

        <OrbitControls makeDefault minDistance={10} maxDistance={100} />
        <ContactShadows opacity={0.4} scale={50} blur={2.5} far={4} resolution={256} color="#000000" />
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur p-2 rounded text-xs text-zinc-400 pointer-events-none select-none">
        Left Click: Rotate • Right Click: Pan • Scroll: Zoom
      </div>
    </div>
  );
}
