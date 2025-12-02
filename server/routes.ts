import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertDimensionsSchema, 
  insertWallSchema, 
  insertOpeningSchema, 
  insertCabinetSchema 
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.listProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dimensions
  app.get("/api/projects/:projectId/dimensions", async (req, res) => {
    try {
      const dimensions = await storage.getDimensions(req.params.projectId);
      res.json(dimensions || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:projectId/dimensions", async (req, res) => {
    try {
      const data = insertDimensionsSchema.parse(req.body);
      const dimensions = await storage.createOrUpdateDimensions(req.params.projectId, data);
      res.json(dimensions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Walls
  app.get("/api/projects/:projectId/walls", async (req, res) => {
    try {
      const walls = await storage.getWallsByProject(req.params.projectId);
      res.json(walls);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:projectId/walls", async (req, res) => {
    try {
      const data = insertWallSchema.parse(req.body);
      const wall = await storage.createWall({ ...data, projectId: req.params.projectId });
      res.json(wall);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/walls/:id", async (req, res) => {
    try {
      const data = insertWallSchema.partial().parse(req.body);
      const wall = await storage.updateWall(req.params.id, data);
      res.json(wall);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/walls/:id", async (req, res) => {
    try {
      await storage.deleteWall(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Openings
  app.get("/api/projects/:projectId/openings", async (req, res) => {
    try {
      const openings = await storage.getOpeningsByProject(req.params.projectId);
      res.json(openings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:projectId/openings", async (req, res) => {
    try {
      const data = insertOpeningSchema.parse(req.body);
      const opening = await storage.createOpening({ ...data, projectId: req.params.projectId });
      res.json(opening);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/openings/:id", async (req, res) => {
    try {
      const data = insertOpeningSchema.partial().parse(req.body);
      const opening = await storage.updateOpening(req.params.id, data);
      res.json(opening);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/openings/:id", async (req, res) => {
    try {
      await storage.deleteOpening(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cabinets
  app.get("/api/projects/:projectId/cabinets", async (req, res) => {
    try {
      const cabinets = await storage.getCabinetsByProject(req.params.projectId);
      res.json(cabinets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:projectId/cabinets", async (req, res) => {
    try {
      const data = insertCabinetSchema.parse(req.body);
      const cabinet = await storage.createCabinet({ ...data, projectId: req.params.projectId });
      res.json(cabinet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/cabinets/:id", async (req, res) => {
    try {
      const data = insertCabinetSchema.partial().parse(req.body);
      const cabinet = await storage.updateCabinet(req.params.id, data);
      res.json(cabinet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/cabinets/:id", async (req, res) => {
    try {
      await storage.deleteCabinet(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
