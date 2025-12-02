import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Dimensions, Opening, WallElement } from "@/lib/construction-types";
import { generateSceneGroup } from "@/lib/scene-generator";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

interface ScenePreviewProps {
  dimensions: Dimensions;
  walls: WallElement[];
  openings: Opening[];
  showRoof?: boolean;
  onRoofToggle?: (show: boolean) => void;
  showCampers?: boolean;
  onCampersToggle?: (show: boolean) => void;
}

export default function ScenePreview({ dimensions, walls, openings, showRoof = true, onRoofToggle, showCampers = true, onCampersToggle }: ScenePreviewProps) {
  const [localShowRoof, setLocalShowRoof] = useState(showRoof);
  const [localShowCampers, setLocalShowCampers] = useState(showCampers);
  const [showHelpText, setShowHelpText] = useState(true);

  const handleRoofToggle = () => {
    const newValue = !localShowRoof;
    setLocalShowRoof(newValue);
    onRoofToggle?.(newValue);
  };

  const handleCampersToggle = () => {
    const newValue = !localShowCampers;
    setLocalShowCampers(newValue);
    onCampersToggle?.(newValue);
  };

  // Re-generate the scene group whenever inputs change
  const sceneGroup = useMemo(() => {
    return generateSceneGroup(dimensions, walls, openings, localShowRoof, localShowCampers);
  }, [dimensions, walls, openings, localShowRoof, localShowCampers]);

  // Cleanup resources
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
    <div className="w-full h-full bg-zinc-950 shadow-inner relative">
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
      
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          size="sm"
          variant={localShowRoof ? "default" : "secondary"}
          onClick={handleRoofToggle}
          className="gap-2"
          data-testid="button-toggle-roof"
        >
          {localShowRoof ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {localShowRoof ? 'Hide' : 'Show'} Roof
        </Button>
        <Button
          size="sm"
          variant={localShowCampers ? "default" : "secondary"}
          onClick={handleCampersToggle}
          className="gap-2"
          data-testid="button-toggle-campers"
        >
          {localShowCampers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {localShowCampers ? 'Hide' : 'Show'} Campers
        </Button>
      </div>
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        {showHelpText && (
          <div className="bg-zinc-900/80 backdrop-blur p-2 rounded text-xs text-zinc-400 pointer-events-none select-none">
            Left Click: Rotate • Right Click: Pan • Scroll: Zoom • Campers: Draggable
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHelpText(!showHelpText)}
          className="gap-2 w-fit ml-auto"
          data-testid="button-toggle-help"
        >
          {showHelpText ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
