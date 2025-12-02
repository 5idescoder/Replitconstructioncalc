import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";
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
  InsertCabinet,
} from "@shared/schema";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema,
});

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;

  // Dimensions
  getDimensions(projectId: string): Promise<ProjectDimensions | undefined>;
  createOrUpdateDimensions(projectId: string, dimensions: InsertDimensions): Promise<ProjectDimensions>;

  // Walls
  getWallsByProject(projectId: string): Promise<ProjectWall[]>;
  createWall(wall: InsertWall & { projectId: string }): Promise<ProjectWall>;
  updateWall(id: string, updates: Partial<InsertWall>): Promise<ProjectWall>;
  deleteWall(id: string): Promise<void>;

  // Openings
  getOpeningsByProject(projectId: string): Promise<ProjectOpening[]>;
  createOpening(opening: InsertOpening & { projectId: string }): Promise<ProjectOpening>;
  updateOpening(id: string, updates: Partial<InsertOpening>): Promise<ProjectOpening>;
  deleteOpening(id: string): Promise<void>;

  // Cabinets
  getCabinetsByProject(projectId: string): Promise<ProjectCabinet[]>;
  createCabinet(cabinet: InsertCabinet & { projectId: string }): Promise<ProjectCabinet>;
  updateCabinet(id: string, updates: Partial<InsertCabinet>): Promise<ProjectCabinet>;
  deleteCabinet(id: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(schema.projects).where(sql`id = ${id}`).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(schema.projects).values(project).returning();
    return result[0];
  }

  async listProjects(): Promise<Project[]> {
    return await db.select().from(schema.projects);
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(schema.projects).where(sql`id = ${id}`);
  }

  async getDimensions(projectId: string): Promise<ProjectDimensions | undefined> {
    const result = await db
      .select()
      .from(schema.projectDimensions)
      .where(sql`project_id = ${projectId}`)
      .limit(1);
    return result[0];
  }

  async createOrUpdateDimensions(projectId: string, dimensions: InsertDimensions): Promise<ProjectDimensions> {
    const existing = await this.getDimensions(projectId);
    if (existing) {
      const result = await db
        .update(schema.projectDimensions)
        .set(dimensions)
        .where(sql`project_id = ${projectId}`)
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(schema.projectDimensions)
        .values({ ...dimensions, projectId })
        .returning();
      return result[0];
    }
  }

  async getWallsByProject(projectId: string): Promise<ProjectWall[]> {
    return await db.select().from(schema.projectWalls).where(sql`project_id = ${projectId}`);
  }

  async createWall(wall: InsertWall & { projectId: string }): Promise<ProjectWall> {
    const result = await db.insert(schema.projectWalls).values(wall).returning();
    return result[0];
  }

  async updateWall(id: string, updates: Partial<InsertWall>): Promise<ProjectWall> {
    const result = await db.update(schema.projectWalls).set(updates).where(sql`id = ${id}`).returning();
    return result[0];
  }

  async deleteWall(id: string): Promise<void> {
    await db.delete(schema.projectWalls).where(sql`id = ${id}`);
  }

  async getOpeningsByProject(projectId: string): Promise<ProjectOpening[]> {
    return await db.select().from(schema.projectOpenings).where(sql`project_id = ${projectId}`);
  }

  async createOpening(opening: InsertOpening & { projectId: string }): Promise<ProjectOpening> {
    const result = await db.insert(schema.projectOpenings).values(opening).returning();
    return result[0];
  }

  async updateOpening(id: string, updates: Partial<InsertOpening>): Promise<ProjectOpening> {
    const result = await db.update(schema.projectOpenings).set(updates).where(sql`id = ${id}`).returning();
    return result[0];
  }

  async deleteOpening(id: string): Promise<void> {
    await db.delete(schema.projectOpenings).where(sql`id = ${id}`);
  }

  async getCabinetsByProject(projectId: string): Promise<ProjectCabinet[]> {
    return await db.select().from(schema.projectCabinets).where(sql`project_id = ${projectId}`);
  }

  async createCabinet(cabinet: InsertCabinet & { projectId: string }): Promise<ProjectCabinet> {
    const result = await db.insert(schema.projectCabinets).values(cabinet).returning();
    return result[0];
  }

  async updateCabinet(id: string, updates: Partial<InsertCabinet>): Promise<ProjectCabinet> {
    const result = await db.update(schema.projectCabinets).set(updates).where(sql`id = ${id}`).returning();
    return result[0];
  }

  async deleteCabinet(id: string): Promise<void> {
    await db.delete(schema.projectCabinets).where(sql`id = ${id}`);
  }
}

export const storage = new DrizzleStorage();
