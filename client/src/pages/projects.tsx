import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ConstructionCalculator from "@/components/construction/Calculator";
import ProjectManager from "@/components/construction/ProjectManager";
import { Button } from "@/components/ui/button";
import { useProject, useDimensions, useWalls, useOpenings, useCabinets } from "@/lib/api-hooks";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Plus } from "lucide-react";

export default function ProjectsPage() {
  const { toast } = useToast();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const projectQuery = useProject(currentProjectId || "");
  const dimensionsQuery = useDimensions(currentProjectId || "");
  const wallsQuery = useWalls(currentProjectId || "");
  const openingsQuery = useOpenings(currentProjectId || "");
  const cabinetsQuery = useCabinets(currentProjectId || "");

  useEffect(() => {
    // Load first project on mount if available
    const savedProjectId = localStorage.getItem("lastProjectId");
    if (savedProjectId) {
      setCurrentProjectId(savedProjectId);
    }
  }, []);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem("lastProjectId", currentProjectId);
    }
  }, [currentProjectId]);

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id);
    setIsCreatingNew(false);
  };

  const handleNewProject = () => {
    setIsCreatingNew(true);
    setCurrentProjectId(null);
    toast({ title: "New Project", description: "Create a new project to get started" });
  };

  // Show project manager if no project selected
  if (!currentProjectId) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 mb-4">
          <Hammer className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">METATIMS BUILDER</h1>
        </div>
        <p className="text-muted-foreground mb-8">Select or create a project to begin</p>
        <div className="w-full max-w-md">
          <ProjectManager
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
          />
        </div>
      </div>
    );
  }

  // Show calculator once project is loaded
  if (!dimensionsQuery.data || !wallsQuery.data || !openingsQuery.data || !cabinetsQuery.data) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border/40 bg-muted/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProjectManager
            currentProjectId={currentProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
          />
          {projectQuery.data && (
            <h1 className="text-lg font-semibold">{projectQuery.data.name}</h1>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <ConstructionCalculator projectId={currentProjectId} />
      </div>
    </div>
  );
}
