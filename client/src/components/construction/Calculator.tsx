import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Info, Scissors, Hammer, Home, GripVertical, BoxSelect, ChevronDown, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Dimensions, Opening, Prices, WallElement, Cabinet } from "@/lib/construction-types";
import { calculateMaterials, calculateCabinetMaterials } from "@/lib/calculations";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ScenePreview from "./ScenePreview";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDimensions, useUpdateDimensions, useWalls, useCreateWall, useUpdateWall, useDeleteWall, useOpenings, useCreateOpening, useUpdateOpening, useDeleteOpening, useCabinets, useCreateCabinet, useUpdateCabinet, useDeleteCabinet } from "@/lib/api-hooks";

export default function ConstructionCalculator({ projectId }: { projectId?: string }) {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Query hooks
  const dimensionsQuery = useDimensions(projectId || "");
  const updateDimensionsMutation = useUpdateDimensions();
  const wallsQuery = useWalls(projectId || "");
  const createWallMutation = useCreateWall();
  const updateWallMutation = useUpdateWall();
  const deleteWallMutation = useDeleteWall();
  const openingsQuery = useOpenings(projectId || "");
  const createOpeningMutation = useCreateOpening();
  const updateOpeningMutation = useUpdateOpening();
  const deleteOpeningMutation = useDeleteOpening();
  const cabinetsQuery = useCabinets(projectId || "");
  const createCabinetMutation = useCreateCabinet();
  const updateCabinetMutation = useUpdateCabinet();
  const deleteCabinetMutation = useDeleteCabinet();

  // --- State ---
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 20,
    width: 20,
    height: 8,
    studLength: 8,
    beamLength: 8,
    roofPitch: 6, 
    overhang: 12,
    roofType: 'ridge'
  });

  const [prices, setPrices] = useState<Prices>({
    stud: 3.98,
    beam: 12.98,
    sheetrock: 15.98,
    plywood: 32.50,
    shingleSquare: 35.00,
    concrete: 150.00
  });

  const [walls, setWalls] = useState<WallElement[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'calculator' | 'preview' | 'cutlist' | 'cabinet'>('preview');
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<'select' | 'add_wall' | 'add_window' | 'add_door'>('select');
  
  const [expandedSections, setExpandedSections] = useState({
    global: true,
    walls: true,
    cabinets: false
  });
  const [showRoof, setShowRoof] = useState(true);
  const [showCabinets, setShowCabinets] = useState(true);
  const [showInspector, setShowInspector] = useState(true);

  // Load data from database when project is selected
  useEffect(() => {
    if (dimensionsQuery.data && dimensionsQuery.data.id) {
      const data = dimensionsQuery.data as any;
      setDimensions({
        length: parseFloat(data.length) || 20,
        width: parseFloat(data.width) || 20,
        height: parseFloat(data.height) || 8,
        studLength: parseFloat(data.studLength) || 8,
        beamLength: parseFloat(data.beamLength) || 8,
        roofPitch: parseFloat(data.roofPitch) || 6,
        overhang: parseFloat(data.overhang) || 12,
        roofType: (data.roofType as 'ridge' | 'hipped') || 'ridge'
      });
    }
  }, [dimensionsQuery.data]);

  useEffect(() => {
    if (wallsQuery.data && Array.isArray(wallsQuery.data)) {
      const walls = wallsQuery.data.map((w: any) => ({
        ...w,
        length: parseFloat(w.length),
        height: parseFloat(w.height),
        rotation: parseFloat(w.rotation),
        position: { x: parseFloat(w.posX), y: parseFloat(w.posY), z: parseFloat(w.posZ) }
      }));
      setWalls(walls);
    }
  }, [wallsQuery.data]);

  useEffect(() => {
    if (openingsQuery.data && Array.isArray(openingsQuery.data)) {
      const openings = openingsQuery.data.map((o: any) => ({
        ...o,
        position: parseFloat(o.position),
        width: parseFloat(o.width),
        height: parseFloat(o.height),
        floorHeight: parseFloat(o.floorHeight)
      }));
      setOpenings(openings);
    }
  }, [openingsQuery.data]);

  useEffect(() => {
    if (cabinetsQuery.data && Array.isArray(cabinetsQuery.data)) {
      const cabinets = cabinetsQuery.data.map((c: any) => ({
        ...c,
        width: parseFloat(c.width),
        depth: parseFloat(c.depth),
        height: parseFloat(c.height),
        doorCount: parseInt(c.doorCount)
      }));
      setCabinets(cabinets);
    }
  }, [cabinetsQuery.data]);

  // Auto-save dimensions when they change
  useEffect(() => {
    if (!projectId) return;
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      updateDimensionsMutation.mutate({ 
        projectId, 
        data: dimensions as any
      }, {
        onSuccess: () => {
          setIsSaving(false);
        },
        onError: () => {
          setIsSaving(false);
          toast({ variant: "destructive", title: "Save Failed", description: "Could not save dimensions" });
        }
      });
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [dimensions, projectId]);

  // --- Initialization ---
  useEffect(() => {
    updateExteriorWalls(dimensions);
  }, []); 
  
  const updateExteriorWalls = (dims: Dimensions) => {
    setWalls(prev => {
      const interiors = prev.filter(w => w.type === 'interior');
      
      const front: WallElement = {
        id: 'wall-front', type: 'exterior', name: 'Front Wall',
        length: dims.length, height: dims.height,
        position: { x: 0, y: 0, z: dims.width/2 }, rotation: 0, isLocked: true
      };
      const back: WallElement = {
        id: 'wall-back', type: 'exterior', name: 'Back Wall',
        length: dims.length, height: dims.height,
        position: { x: 0, y: 0, z: -dims.width/2 }, rotation: 0, isLocked: true
      };
      const right: WallElement = {
        id: 'wall-right', type: 'exterior', name: 'Right Wall',
        length: dims.width, height: dims.height,
        position: { x: dims.length/2, y: 0, z: 0 }, rotation: Math.PI/2, isLocked: true
      };
      const left: WallElement = {
        id: 'wall-left', type: 'exterior', name: 'Left Wall',
        length: dims.width, height: dims.height,
        position: { x: -dims.length/2, y: 0, z: 0 }, rotation: Math.PI/2, isLocked: true
      };
      
      return [...interiors, front, back, right, left];
    });
  };

  useEffect(() => {
    updateExteriorWalls(dimensions);
  }, [dimensions.length, dimensions.width, dimensions.height]);

  // --- Handlers ---

  const handleAddInteriorWall = async () => {
    if (!projectId) return;
    const newWall: WallElement = {
      id: nanoid(),
      type: 'interior',
      name: `Interior Wall ${walls.filter(w => w.type === 'interior').length + 1}`,
      length: 10,
      height: dimensions.height,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0
    };
    setWalls([...walls, newWall]);
    setSelectedWallId(newWall.id);
    
    try {
      await createWallMutation.mutateAsync({
        projectId,
        data: newWall as any
      });
      toast({ title: "Wall Added", description: "New interior wall created." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save wall" });
    }
  };

  const handleAddOpening = async (type: 'window' | 'door') => {
    if (!selectedWallId || !projectId) {
      toast({ variant: "destructive", title: "No Wall Selected", description: "Please select a wall to add an opening." });
      return;
    }
    
    const newOp: Opening = {
      id: nanoid(),
      type,
      wallId: selectedWallId,
      position: 4,
      width: type === 'window' ? 3 : 3,
      height: type === 'window' ? 4 : 6.6,
      floorHeight: type === 'window' ? 3 : 0
    };
    
    setOpenings([...openings, newOp]);
    
    try {
      await createOpeningMutation.mutateAsync({
        projectId,
        data: newOp as any
      });
      toast({ title: "Opening Added", description: `Added ${type} to selected wall.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save opening" });
    }
  };

  const handleAddCabinet = async () => {
    if (!projectId) return;
    const newCabinet: Cabinet = {
      id: nanoid(),
      name: `Cabinet ${cabinets.length + 1}`,
      width: 36,
      depth: 12,
      height: 30,
      doorCount: 2
    };
    setCabinets([...cabinets, newCabinet]);
    setSelectedCabinetId(newCabinet.id);
    setActiveTab('cabinet');
    
    try {
      await createCabinetMutation.mutateAsync({
        projectId,
        data: newCabinet as any
      });
      toast({ title: "Cabinet Added", description: "New cabinet created." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save cabinet" });
    }
  };

  const updateCabinet = async (id: string, updates: Partial<Cabinet>) => {
    if (!projectId) return;
    setCabinets(cabinets.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await updateCabinetMutation.mutateAsync({
        id,
        data: updates as any
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save cabinet" });
    }
  };
  
  const updateWall = async (id: string, updates: Partial<WallElement>) => {
    if (!projectId) return;
    setWalls(walls.map(w => w.id === id ? { ...w, ...updates } : w));
    try {
      await updateWallMutation.mutateAsync({
        id,
        data: updates as any
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save wall" });
    }
  };
  
  const updateOpening = async (id: string, updates: Partial<Opening>) => {
    if (!projectId) return;
    setOpenings(openings.map(o => o.id === id ? { ...o, ...updates } : o));
    try {
      await updateOpeningMutation.mutateAsync({
        id,
        data: updates as any
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save opening" });
    }
  };

  const handleExportProject = () => {
    const data = {
      dimensions,
      walls,
      openings,
      cabinets,
      prices
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Project exported as JSON" });
  };

  const results = calculateMaterials(dimensions, prices, walls, openings);
  const selectedWall = walls.find(w => w.id === selectedWallId);

  if (!projectId) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Select or create a project to begin</div>;
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <header className="flex-none h-16 border-b border-border/40 bg-muted/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Hammer className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-display font-bold tracking-tight">METATIMS <span className="font-light opacity-70">BUILDER</span></h1>
        </div>
        
        <div className="flex gap-2 items-center">
          <Button size="sm" variant={activeTab === 'preview' ? 'default' : 'ghost'} onClick={() => setActiveTab('preview')}>Builder 3D</Button>
          <Button size="sm" variant={activeTab === 'cutlist' ? 'default' : 'ghost'} onClick={() => setActiveTab('cutlist')}>Cut List</Button>
          <Button size="sm" variant={activeTab === 'cabinet' ? 'default' : 'ghost'} onClick={() => setActiveTab('cabinet')}>Cabinets</Button>
          <Button size="sm" variant={activeTab === 'calculator' ? 'default' : 'ghost'} onClick={() => setActiveTab('calculator')}>Estimate</Button>
          
          <Separator orientation="vertical" className="mx-2" />
          
          <Button size="sm" variant="outline" className="gap-2" onClick={handleExportProject} data-testid="button-export">
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          {isSaving && (
            <Badge variant="secondary" className="gap-1">
              <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
              Saving...
            </Badge>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Toolbox & Outliner */}
        <div className="w-80 flex-none border-r border-border/40 bg-muted/5 flex flex-col">
          
          {/* Tools */}
          <div className="p-4 grid grid-cols-2 gap-2 border-b border-border/40">
            <Button 
              variant={toolMode === 'select' ? 'secondary' : 'outline'} 
              className="justify-start gap-2"
              onClick={() => setToolMode('select')}
            >
              <BoxSelect className="w-4 h-4" /> Select
            </Button>
            <Button 
              variant="outline"
              className="justify-start gap-2"
              onClick={handleAddInteriorWall}
            >
              <Plus className="w-4 h-4" /> New Wall
            </Button>
            <Button 
              variant="outline"
              className="justify-start gap-2"
              onClick={() => handleAddOpening('window')}
              disabled={!selectedWallId}
            >
              <Plus className="w-4 h-4" /> Window
            </Button>
            <Button 
              variant="outline"
              className="justify-start gap-2"
              onClick={handleAddCabinet}
            >
              <Plus className="w-4 h-4" /> Cabinet
            </Button>
          </div>
          
          {/* Structure Tree */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              
              {/* Global Settings Collapsible */}
              <Collapsible
                open={expandedSections.global}
                onOpenChange={(open) => setExpandedSections({...expandedSections, global: open})}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-2 rounded">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.global ? '' : '-rotate-90'}`} />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Global</h3>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 ml-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Length</Label>
                      <Input type="number" value={dimensions.length} onChange={e => setDimensions({...dimensions, length: +e.target.value})} className="h-7 text-xs" data-testid="input-length" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Width</Label>
                      <Input type="number" value={dimensions.width} onChange={e => setDimensions({...dimensions, width: +e.target.value})} className="h-7 text-xs" data-testid="input-width" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Height</Label>
                      <Input type="number" value={dimensions.height} onChange={e => setDimensions({...dimensions, height: +e.target.value})} className="h-7 text-xs" data-testid="input-height" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Pitch</Label>
                      <Input type="number" value={dimensions.roofPitch} onChange={e => setDimensions({...dimensions, roofPitch: +e.target.value})} className="h-7 text-xs" data-testid="input-pitch" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Roof Type</Label>
                    <Select value={dimensions.roofType || 'ridge'} onValueChange={(value) => setDimensions({...dimensions, roofType: value as 'ridge' | 'hipped'})}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ridge">Ridge</SelectItem>
                        <SelectItem value="hipped">Hipped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Walls Collapsible */}
              <Collapsible
                open={expandedSections.walls}
                onOpenChange={(open) => setExpandedSections({...expandedSections, walls: open})}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-2 rounded">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.walls ? '' : '-rotate-90'}`} />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Walls</h3>
                  <Badge variant="outline" className="text-[9px]">{walls.length}</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2 ml-4">
                  {walls.map(wall => (
                    <div 
                      key={wall.id}
                      onClick={() => setSelectedWallId(wall.id)}
                      className={`
                        flex items-center justify-between p-2 rounded cursor-pointer text-sm border transition-colors
                        ${selectedWallId === wall.id ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-transparent hover:bg-muted'}
                      `}
                      data-testid={`wall-item-${wall.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3 h-3 opacity-50" />
                        <span className="truncate max-w-[120px]">{wall.name}</span>
                      </div>
                      {wall.type === 'interior' && (
                        <Trash2 
                          className="w-3 h-3 text-muted-foreground hover:text-destructive" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setWalls(walls.filter(w => w.id !== wall.id));
                            deleteWallMutation.mutate(wall.id);
                            if (selectedWallId === wall.id) setSelectedWallId(null);
                          }}
                          data-testid={`delete-wall-${wall.id}`}
                        />
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Cabinets Collapsible */}
              <Collapsible
                open={expandedSections.cabinets}
                onOpenChange={(open) => setExpandedSections({...expandedSections, cabinets: open})}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-2 rounded">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.cabinets ? '' : '-rotate-90'}`} />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Cabinets</h3>
                  <Badge variant="outline" className="text-[9px]">{cabinets.length}</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2 ml-4">
                  {cabinets.map(cab => (
                    <div 
                      key={cab.id}
                      onClick={() => setSelectedCabinetId(cab.id)}
                      className={`
                        flex items-center justify-between p-2 rounded cursor-pointer text-sm border transition-colors
                        ${selectedCabinetId === cab.id ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-transparent hover:bg-muted'}
                      `}
                      data-testid={`cabinet-item-${cab.id}`}
                    >
                      <span className="truncate">{cab.name}</span>
                      <Trash2 
                        className="w-3 h-3 text-muted-foreground hover:text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCabinets(cabinets.filter(c => c.id !== cab.id));
                          deleteCabinetMutation.mutate(cab.id);
                          if (selectedCabinetId === cab.id) setSelectedCabinetId(null);
                        }}
                        data-testid={`delete-cabinet-${cab.id}`}
                      />
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

            </div>
          </ScrollArea>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col relative bg-black/5">
          
          {activeTab === 'preview' && (
            <div className="flex-1 relative">
              <ScenePreview dimensions={dimensions} walls={walls} openings={openings} showRoof={showRoof} onRoofToggle={setShowRoof} showCabinets={showCabinets} onCabinetsToggle={setShowCabinets} />
              
              {/* Inspector Overlay (Right Side) */}
              {selectedWall && showInspector && (
                <div className="absolute top-4 right-4 w-72 bg-card/95 backdrop-blur border border-border/50 rounded-lg shadow-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-sm">{selectedWall.name} Properties</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{selectedWall.type}</Badge>
                  </div>
                  
                  {selectedWall.type === 'interior' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Length (ft)</Label>
                        <div className="flex gap-2 items-center">
                          <Slider 
                            min={1} max={30} step={0.5} 
                            value={[selectedWall.length]} 
                            onValueChange={([v]) => updateWall(selectedWall.id, { length: v })}
                            className="flex-1"
                            data-testid="slider-wall-length"
                          />
                          <span className="text-xs w-10 text-right">{selectedWall.length.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position X (ft)</Label>
                        <div className="flex gap-2 items-center">
                          <Slider 
                            min={-20} max={20} step={0.5} 
                            value={[selectedWall.position.x]} 
                            onValueChange={([v]) => updateWall(selectedWall.id, { position: { ...selectedWall.position, x: v } })}
                            className="flex-1"
                            data-testid="slider-wall-pos-x"
                          />
                          <span className="text-xs w-10 text-right">{selectedWall.position.x.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position Z (ft)</Label>
                        <div className="flex gap-2 items-center">
                          <Slider 
                            min={-20} max={20} step={0.5} 
                            value={[selectedWall.position.z]} 
                            onValueChange={([v]) => updateWall(selectedWall.id, { position: { ...selectedWall.position, z: v } })}
                            className="flex-1"
                            data-testid="slider-wall-pos-z"
                          />
                          <span className="text-xs w-10 text-right">{selectedWall.position.z.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rotation (rad)</Label>
                        <div className="flex gap-2">
                          <Slider 
                            min={0} max={Math.PI * 2} step={0.1} 
                            value={[selectedWall.rotation]} 
                            onValueChange={([v]) => updateWall(selectedWall.id, { rotation: v })}
                            className="flex-1"
                            data-testid="slider-wall-rotation"
                          />
                          <span className="text-xs w-8 text-right">{(selectedWall.rotation * 180 / Math.PI).toFixed(0)}°</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Openings on Wall</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {openings.filter(o => o.wallId === selectedWall.id).map(op => (
                        <div key={op.id} className="bg-muted/50 p-2 rounded border border-border/20 space-y-2" data-testid={`opening-${op.id}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium capitalize">{op.type}</span>
                            <Trash2 className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => { setOpenings(openings.filter(x => x.id !== op.id)); deleteOpeningMutation.mutate(op.id); }} data-testid={`delete-opening-${op.id}`} />
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="text-[9px]">Position</Label>
                                <span className="text-[9px]">{op.position.toFixed(1)}</span>
                              </div>
                              <Slider 
                                min={0} max={selectedWall.length} step={0.25} 
                                value={[op.position]} 
                                onValueChange={([v]) => updateOpening(op.id, { position: v })}
                                className="h-1"
                                data-testid={`slider-opening-pos-${op.id}`}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="text-[9px]">Width</Label>
                                <span className="text-[9px]">{op.width.toFixed(1)}</span>
                              </div>
                              <Slider 
                                min={0.5} max={6} step={0.25} 
                                value={[op.width]} 
                                onValueChange={([v]) => updateOpening(op.id, { width: v })}
                                className="h-1"
                                data-testid={`slider-opening-width-${op.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {openings.filter(o => o.wallId === selectedWall.id).length === 0 && (
                        <div className="text-xs text-muted-foreground italic text-center py-2">No openings</div>
                      )}
                    </div>
                  </div>

                </div>
              )}
              
              {/* Collapse Inspector Button */}
              {selectedWall && (
                <button
                  onClick={() => setShowInspector(!showInspector)}
                  className="absolute top-4 right-4 p-2 rounded-md hover:bg-zinc-800/50 transition-colors"
                  data-testid="button-collapse-inspector"
                  title={showInspector ? "Collapse inspector" : "Expand inspector"}
                >
                  {showInspector ? (
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  )}
                </button>
              )}
            </div>
          )}

          {activeTab === 'cutlist' && (
            <div className="flex-1 p-8 overflow-auto bg-background">
              <Card>
                <CardHeader>
                  <CardTitle>Cut List</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Length</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.cutList.map((item, i) => (
                        <TableRow key={i} data-testid={`cutlist-row-${i}`}>
                          <TableCell className="font-medium text-primary">{item.material}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right font-mono">{Math.floor(item.length/12)}' {(item.length%12).toFixed(1)}"</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'cabinet' && (
            <div className="flex-1 p-8 overflow-auto bg-background">
              {selectedCabinetId && cabinets.find(c => c.id === selectedCabinetId) && (() => {
                const selectedCabinet = cabinets.find(c => c.id === selectedCabinetId)!;
                const cabinetResults = calculateCabinetMaterials(selectedCabinet);
                
                return (
                  <div className="grid grid-cols-3 gap-8">
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base">Cabinet Dimensions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Width (in)</Label>
                          <Input type="number" value={selectedCabinet.width} onChange={(e) => updateCabinet(selectedCabinet.id, { width: +e.target.value })} data-testid="cabinet-width-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Depth (in)</Label>
                          <Input type="number" value={selectedCabinet.depth} onChange={(e) => updateCabinet(selectedCabinet.id, { depth: +e.target.value })} data-testid="cabinet-depth-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Height (in)</Label>
                          <Input type="number" value={selectedCabinet.height} onChange={(e) => updateCabinet(selectedCabinet.id, { height: +e.target.value })} data-testid="cabinet-height-input" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Door Count</Label>
                          <Input type="number" value={selectedCabinet.doorCount} onChange={(e) => updateCabinet(selectedCabinet.id, { doorCount: +e.target.value })} data-testid="cabinet-doors-input" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">Materials</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow data-testid="cabinet-material-plywood">
                              <TableCell>Plywood (3/4")</TableCell>
                              <TableCell className="text-right">{cabinetResults.materials.plywood.toFixed(1)}</TableCell>
                              <TableCell className="text-right">sq ft</TableCell>
                            </TableRow>
                            <TableRow data-testid="cabinet-material-hardwood">
                              <TableCell>Hardwood (Face Frame)</TableCell>
                              <TableCell className="text-right">{cabinetResults.materials.hardwood.toFixed(1)}</TableCell>
                              <TableCell className="text-right">linear ft</TableCell>
                            </TableRow>
                            <TableRow data-testid="cabinet-material-trim">
                              <TableCell>Trim & Edging (1x4)</TableCell>
                              <TableCell className="text-right">{cabinetResults.materials.oneByFour.toFixed(1)}</TableCell>
                              <TableCell className="text-right">linear ft</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                );
              })() || (
                <div className="text-center text-muted-foreground py-12">Select a cabinet to view details</div>
              )}
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="flex-1 p-8 overflow-auto bg-background">
              <div className="grid grid-cols-2 gap-8 max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(prices).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input type="number" value={value} onChange={(e) => setPrices({...prices, [key]: +e.target.value})} step="0.01" data-testid={`price-${key}`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Materials Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Studs (2x4):</span>
                      <span className="font-mono">{results.total2x4Pieces.toFixed(0)} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beams (2x6):</span>
                      <span className="font-mono">{results.total2x6Pieces.toFixed(0)} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sheetrock:</span>
                      <span className="font-mono">{results.sheetrockPieces.toFixed(1)} sheets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plywood:</span>
                      <span className="font-mono">{results.plywoodPieces.toFixed(1)} sheets</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Cost:</span>
                      <span className="text-primary">${results.totalCost.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
