import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { 
  Project, 
  InsertProject, 
  ProjectDimensions, 
  InsertDimensions,
  ProjectWall,
  InsertWall,
  ProjectOpening,
  InsertOpening,
  ProjectCabinet,
  InsertCabinet
} from "@shared/schema";

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<Project[]>;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json() as Promise<Project>;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json() as Promise<Project>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Dimensions
export function useDimensions(projectId: string) {
  return useQuery({
    queryKey: ["dimensions", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/dimensions`);
      if (!res.ok) throw new Error("Failed to fetch dimensions");
      return res.json() as Promise<ProjectDimensions | null>;
    },
    enabled: !!projectId,
  });
}

export function useUpdateDimensions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: InsertDimensions }) => {
      const res = await fetch(`/api/projects/${projectId}/dimensions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update dimensions");
      return res.json() as Promise<ProjectDimensions>;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["dimensions", projectId] });
    },
  });
}

// Walls
export function useWalls(projectId: string) {
  return useQuery({
    queryKey: ["walls", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/walls`);
      if (!res.ok) throw new Error("Failed to fetch walls");
      return res.json() as Promise<ProjectWall[]>;
    },
    enabled: !!projectId,
  });
}

export function useCreateWall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: InsertWall }) => {
      const res = await fetch(`/api/projects/${projectId}/walls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create wall");
      return res.json() as Promise<ProjectWall>;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["walls", projectId] });
    },
  });
}

export function useUpdateWall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertWall> }) => {
      const res = await fetch(`/api/walls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update wall");
      return res.json() as Promise<ProjectWall>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walls"] });
    },
  });
}

export function useDeleteWall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/walls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete wall");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walls"] });
    },
  });
}

// Openings
export function useOpenings(projectId: string) {
  return useQuery({
    queryKey: ["openings", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/openings`);
      if (!res.ok) throw new Error("Failed to fetch openings");
      return res.json() as Promise<ProjectOpening[]>;
    },
    enabled: !!projectId,
  });
}

export function useCreateOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: InsertOpening }) => {
      const res = await fetch(`/api/projects/${projectId}/openings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create opening");
      return res.json() as Promise<ProjectOpening>;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["openings", projectId] });
    },
  });
}

export function useUpdateOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertOpening> }) => {
      const res = await fetch(`/api/openings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update opening");
      return res.json() as Promise<ProjectOpening>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openings"] });
    },
  });
}

export function useDeleteOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/openings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete opening");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openings"] });
    },
  });
}

// Cabinets
export function useCabinets(projectId: string) {
  return useQuery({
    queryKey: ["cabinets", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/cabinets`);
      if (!res.ok) throw new Error("Failed to fetch cabinets");
      return res.json() as Promise<ProjectCabinet[]>;
    },
    enabled: !!projectId,
  });
}

export function useCreateCabinet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: InsertCabinet }) => {
      const res = await fetch(`/api/projects/${projectId}/cabinets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create cabinet");
      return res.json() as Promise<ProjectCabinet>;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["cabinets", projectId] });
    },
  });
}

export function useUpdateCabinet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCabinet> }) => {
      const res = await fetch(`/api/cabinets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update cabinet");
      return res.json() as Promise<ProjectCabinet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
  });
}

export function useDeleteCabinet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cabinets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete cabinet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
  });
}
