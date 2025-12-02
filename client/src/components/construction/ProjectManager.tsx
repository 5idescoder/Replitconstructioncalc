import { useState } from "react";
import { useProjects, useCreateProject, useDeleteProject } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, FileText } from "lucide-react";
import { format } from "date-fns";

interface ProjectManagerProps {
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
}

export default function ProjectManager({ currentProjectId, onSelectProject, onNewProject }: ProjectManagerProps) {
  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const [newProjectName, setNewProjectName] = useState("");
  const [open, setOpen] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        name: newProjectName,
        description: "New construction project",
      });
      setNewProjectName("");
      setOpen(false);
      onSelectProject(result.id);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Projects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* New Project Form */}
          <div className="flex gap-2">
            <Input
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <Button onClick={handleCreateProject} disabled={createMutation.isPending || !newProjectName.trim()}>
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </div>

          {/* Projects List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
          ) : !projects || projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No projects yet. Create one to get started!</div>
          ) : (
            <div className="grid gap-2">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-colors ${
                    currentProjectId === project.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    onSelectProject(project.id);
                    setOpen(false);
                  }}
                >
                  <CardContent className="pt-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {format(new Date(project.createdAt || new Date()), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentProjectId === project.id && (
                        <Badge variant="outline">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(project.id);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
