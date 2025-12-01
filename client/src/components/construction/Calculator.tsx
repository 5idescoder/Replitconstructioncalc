import { useState } from "react";
import { Plus, Trash2, Info, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Dimensions, Opening, Prices } from "@/lib/construction-types";
import { calculateMaterials } from "@/lib/calculations";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ScenePreview from "./ScenePreview";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConstructionCalculator() {
  const { toast } = useToast();

  // --- State ---
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 20,
    width: 20,
    height: 8,
    studLength: 8,
    beamLength: 8
  });

  const [prices, setPrices] = useState<Prices>({
    stud: 3.98,
    beam: 12.98,
    sheetrock: 15.98
  });

  const [openings, setOpenings] = useState<Opening[]>([]);
  const [activeTab, setActiveTab] = useState<'calculator' | 'preview' | 'cutlist'>('calculator');

  // Opening Form State
  const [newOpening, setNewOpening] = useState<Omit<Opening, 'id'>>({
    type: 'window',
    wall: 'front',
    position: 5,
    width: 3,
    height: 4,
    floorHeight: 3
  });

  // --- Handlers ---

  const handleAddOpening = () => {
    const id = nanoid();
    setOpenings([...openings, { ...newOpening, id }]);
    toast({
      title: "Opening Added",
      description: `Added ${newOpening.type} to ${newOpening.wall} wall.`,
    });
  };

  const handleRemoveOpening = (id: string) => {
    setOpenings(openings.filter(o => o.id !== id));
  };

  const results = calculateMaterials(dimensions, prices, openings);

  // Helper to format inches to feet-inches
  const formatLength = (inches: number) => {
    const ft = Math.floor(inches / 12);
    const inRem = inches % 12;
    if (ft > 0) return `${ft}' ${inRem.toFixed(1)}"${inches !== ft*12 + inRem ? ` (${inches.toFixed(1)}")` : ''}`;
    return `${inches.toFixed(1)}"`;
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col gap-6">
      
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tight">
            METATIMS <span className="text-foreground font-light">CALCULATOR</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
            Construction Material Estimator & 3D Visualization
          </p>
        </div>
        
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button 
            variant={activeTab === 'calculator' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('calculator')}
            className="w-24 md:w-32"
          >
            Calculator
          </Button>
          <Button 
            variant={activeTab === 'cutlist' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('cutlist')}
            className="w-24 md:w-32"
          >
            Cut List
          </Button>
          <Button 
            variant={activeTab === 'preview' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('preview')}
            className="w-24 md:w-32"
          >
            3D Preview
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* --- Left Panel: Controls & Inputs --- */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-visible">
          
          {/* Room Dimensions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display uppercase tracking-wider text-accent">Room Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input 
                    id="length" 
                    type="number" 
                    value={dimensions.length} 
                    onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Width (ft)</Label>
                  <Input 
                    id="width" 
                    type="number" 
                    value={dimensions.width} 
                    onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (ft)</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[dimensions.height]} 
                    min={6} 
                    max={20} 
                    step={0.5} 
                    onValueChange={(vals) => setDimensions({...dimensions, height: vals[0]})}
                    className="flex-1"
                  />
                  <Input 
                    id="height" 
                    type="number" 
                    className="w-20"
                    value={dimensions.height} 
                    onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Settings (Collapsible or in a separate section) */}
          <Card>
             <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display uppercase tracking-wider text-muted-foreground">Material Config</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs">Stud Length (ft)</Label>
                   <Input 
                      type="number" 
                      value={dimensions.studLength} 
                      onChange={(e) => setDimensions({...dimensions, studLength: parseFloat(e.target.value) || 0})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs">Beam Length (ft)</Label>
                   <Input 
                      type="number" 
                      value={dimensions.beamLength} 
                      onChange={(e) => setDimensions({...dimensions, beamLength: parseFloat(e.target.value) || 0})}
                   />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">2x4 Price</Label>
                  <Input 
                    className="h-8 text-sm"
                    type="number" 
                    value={prices.stud} 
                    onChange={(e) => setPrices({...prices, stud: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">2x6 Price</Label>
                  <Input 
                     className="h-8 text-sm"
                    type="number" 
                    value={prices.beam} 
                    onChange={(e) => setPrices({...prices, beam: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Sheetrock Price</Label>
                  <Input 
                     className="h-8 text-sm"
                    type="number" 
                    value={prices.sheetrock} 
                    onChange={(e) => setPrices({...prices, sheetrock: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Manager */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display uppercase tracking-wider text-accent">Openings Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={newOpening.type} 
                    onValueChange={(v: any) => setNewOpening({...newOpening, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="window">Window</SelectItem>
                      <SelectItem value="door">Door</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wall</Label>
                  <Select 
                    value={newOpening.wall} 
                    onValueChange={(v: any) => setNewOpening({...newOpening, wall: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front (Z+)</SelectItem>
                      <SelectItem value="right">Right (X+)</SelectItem>
                      <SelectItem value="back">Back (Z-)</SelectItem>
                      <SelectItem value="left">Left (X-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pos (ft)</Label>
                  <Input 
                    type="number" 
                    value={newOpening.position}
                    onChange={(e) => setNewOpening({...newOpening, position: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (ft)</Label>
                  <Input 
                    type="number" 
                    value={newOpening.width}
                    onChange={(e) => setNewOpening({...newOpening, width: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Height (ft)</Label>
                  <Input 
                    type="number" 
                    value={newOpening.height}
                    onChange={(e) => setNewOpening({...newOpening, height: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                   <Label>Floor Ht (ft)</Label>
                   <Input 
                    type="number" 
                    value={newOpening.floorHeight}
                    onChange={(e) => setNewOpening({...newOpening, floorHeight: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <Button onClick={handleAddOpening} className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Opening
              </Button>

              <Separator className="my-2" />

              <ScrollArea className="flex-1 h-[120px]">
                <div className="space-y-2 pr-4">
                  {openings.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 italic">No openings added yet.</div>
                  )}
                  {openings.map(op => (
                    <div key={op.id} className="flex items-center justify-between bg-muted/50 p-2 rounded border border-border/50">
                      <div className="text-sm">
                        <span className="font-semibold capitalize text-foreground">{op.type}</span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="capitalize text-xs text-muted-foreground">{op.wall} Wall</span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => handleRemoveOpening(op.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

            </CardContent>
          </Card>

        </div>

        {/* --- Right Panel: Results or Preview --- */}
        <div className="lg:col-span-8 flex flex-col h-full">
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
            <TabsContent value="calculator" className="h-full mt-0">
               <Card className="h-full border-primary/20 shadow-lg shadow-primary/5">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      Construction Estimate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 lg:p-10 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Material Counts */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-display font-semibold text-foreground border-b border-primary/50 pb-2 inline-block mb-2">Material Breakdown</h3>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors">
                             <span className="font-medium">2x4 Lumber</span>
                             <div className="text-right">
                               <div className="text-xl font-bold text-primary">{results.total2x4Pieces}</div>
                               <div className="text-xs text-muted-foreground">Studs, Plates, Cripples</div>
                             </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors">
                             <span className="font-medium">2x6 Lumber</span>
                             <div className="text-right">
                               <div className="text-xl font-bold text-primary">{results.total2x6Pieces}</div>
                               <div className="text-xs text-muted-foreground">Headers, Joists</div>
                             </div>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors">
                             <span className="font-medium">Sheetrock (4x8)</span>
                             <div className="text-right">
                               <div className="text-xl font-bold text-primary">{results.sheetrockPieces}</div>
                               <div className="text-xs text-muted-foreground">Panels</div>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-6">
                         <h3 className="text-lg font-display font-semibold text-foreground border-b border-primary/50 pb-2 inline-block mb-2">Dimensions</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border p-4 rounded text-center">
                              <div className="text-2xl font-display font-bold">{results.wallArea.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Wall Area (sq ft)</div>
                            </div>
                            <div className="bg-card border p-4 rounded text-center">
                              <div className="text-2xl font-display font-bold">{results.totalOpeningArea.toFixed(1)}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Opening Area (sq ft)</div>
                            </div>
                         </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Total Cost */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="text-center md:text-left">
                        <div className="text-sm font-medium text-primary uppercase tracking-widest">Estimated Project Cost</div>
                        <div className="text-xs text-muted-foreground">Materials only. Labor/waste not included.</div>
                      </div>
                      <div className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tight">
                        ${results.totalCost.toFixed(2)}
                      </div>
                    </div>

                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="cutlist" className="h-full mt-0">
               <Card className="h-full border-primary/20 shadow-lg shadow-primary/5 flex flex-col">
                  <CardHeader className="border-b border-border/50 bg-muted/20 flex-none">
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-primary" />
                      Cut List
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                       <div className="p-6">
                         {results.cutList.length === 0 ? (
                           <div className="text-center text-muted-foreground p-8">No cut list items generated yet.</div>
                         ) : (
                           <Table>
                             <TableHeader>
                               <TableRow className="hover:bg-transparent">
                                 <TableHead className="w-[100px]">Material</TableHead>
                                 <TableHead>Description</TableHead>
                                 <TableHead className="text-right">Length</TableHead>
                                 <TableHead className="text-right">Count</TableHead>
                               </TableRow>
                             </TableHeader>
                             <TableBody>
                               {results.cutList.map((item, i) => (
                                 <TableRow key={i}>
                                   <TableCell className="font-medium text-primary">{item.material}</TableCell>
                                   <TableCell>{item.description}</TableCell>
                                   <TableCell className="text-right font-mono">{formatLength(item.length)}</TableCell>
                                   <TableCell className="text-right">{item.count}</TableCell>
                                 </TableRow>
                               ))}
                             </TableBody>
                           </Table>
                         )}
                       </div>
                    </ScrollArea>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="preview" className="h-full mt-0">
              <div className="h-[500px] lg:h-full relative">
                <ScenePreview dimensions={dimensions} openings={openings} />
              </div>
            </TabsContent>
          </Tabs>

        </div>

      </main>
    </div>
  );
}
