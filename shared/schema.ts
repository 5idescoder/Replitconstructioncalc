import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const projectDimensions = pgTable("project_dimensions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  length: numeric("length", { precision: 10, scale: 2 }).notNull(),
  width: numeric("width", { precision: 10, scale: 2 }).notNull(),
  height: numeric("height", { precision: 10, scale: 2 }).notNull(),
  studLength: numeric("study_length", { precision: 10, scale: 2 }).notNull(),
  beamLength: numeric("beam_length", { precision: 10, scale: 2 }).notNull(),
  roofPitch: numeric("roof_pitch", { precision: 10, scale: 2 }).notNull(),
  overhang: numeric("overhang", { precision: 10, scale: 2 }).notNull(),
  roofType: text("roof_type").default("ridge"),
});

export const projectWalls = pgTable("project_walls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  length: numeric("length", { precision: 10, scale: 2 }).notNull(),
  height: numeric("height", { precision: 10, scale: 2 }).notNull(),
  posX: numeric("pos_x", { precision: 10, scale: 2 }).notNull(),
  posY: numeric("pos_y", { precision: 10, scale: 2 }).notNull(),
  posZ: numeric("pos_z", { precision: 10, scale: 2 }).notNull(),
  rotation: numeric("rotation", { precision: 10, scale: 4 }).notNull(),
  isLocked: boolean("is_locked").default(false),
});

export const projectOpenings = pgTable("project_openings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  wallId: varchar("wall_id").notNull(),
  type: text("type").notNull(),
  position: numeric("position", { precision: 10, scale: 2 }).notNull(),
  width: numeric("width", { precision: 10, scale: 2 }).notNull(),
  height: numeric("height", { precision: 10, scale: 2 }).notNull(),
  floorHeight: numeric("floor_height", { precision: 10, scale: 2 }).notNull(),
});

export const projectCabinets = pgTable("project_cabinets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  width: numeric("width", { precision: 10, scale: 2 }).notNull(),
  depth: numeric("depth", { precision: 10, scale: 2 }).notNull(),
  height: numeric("height", { precision: 10, scale: 2 }).notNull(),
  doorCount: integer("door_count").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
});

export const insertDimensionsSchema = createInsertSchema(projectDimensions).omit({
  id: true,
  projectId: true,
});

export const insertWallSchema = createInsertSchema(projectWalls).omit({
  id: true,
  projectId: true,
});

export const insertOpeningSchema = createInsertSchema(projectOpenings).omit({
  id: true,
  projectId: true,
});

export const insertCabinetSchema = createInsertSchema(projectCabinets).omit({
  id: true,
  projectId: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectDimensions = typeof projectDimensions.$inferSelect;
export type InsertDimensions = z.infer<typeof insertDimensionsSchema>;
export type ProjectWall = typeof projectWalls.$inferSelect;
export type InsertWall = z.infer<typeof insertWallSchema>;
export type ProjectOpening = typeof projectOpenings.$inferSelect;
export type InsertOpening = z.infer<typeof insertOpeningSchema>;
export type ProjectCabinet = typeof projectCabinets.$inferSelect;
export type InsertCabinet = z.infer<typeof insertCabinetSchema>;
