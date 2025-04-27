import { pgTable, text, serial, integer, timestamp, json, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bug identification schema
export const bugIdentifications = pgTable("bug_identifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  additionalImageUrls: text("additional_image_urls").array(),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  confidence: integer("confidence").notNull(),
  type: text("type"),
  habitat: text("habitat"),
  harmLevel: text("harm_level"),
  description: text("description"),
  size: text("size"),
  diet: text("diet"),
  lifespan: text("lifespan"),
  // New enhanced information fields
  threatLevel: text("threat_level"), // harmful/beneficial/neutral assessment
  pestControlRecommendations: text("pest_control_recommendations"),
  environmentalImpact: text("environmental_impact"),
  similarSpecies: json("similar_species"),
  conservationStatus: text("conservation_status"),
  identifiedAt: timestamp("identified_at").defaultNow().notNull(),
  alternativeMatches: json("alternative_matches"),
});

export const insertBugIdentificationSchema = createInsertSchema(bugIdentifications).omit({
  id: true,
  identifiedAt: true
});

export type InsertBugIdentification = z.infer<typeof insertBugIdentificationSchema>;
export type BugIdentification = typeof bugIdentifications.$inferSelect;

// API interfaces
export interface IdentifyBugResponse {
  success: boolean;
  identification?: BugIdentification;
  error?: string;
}

export interface AlternativeMatch {
  name: string;
  scientificName: string;
  confidence: number;
  imageUrl?: string;
}

export interface SimilarSpecies {
  name: string;
  scientificName: string;
  imageUrl?: string;
  differentiatingFeatures?: string;
  commonlyConfusedWith?: boolean;
}

// Logbook entries
export const logbookEntries = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  bugIdentificationId: integer("bug_identification_id").references(() => bugIdentifications.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
  location: text("location"),
  isFavorite: boolean("is_favorite").default(false),
});

export const insertLogbookEntrySchema = createInsertSchema(logbookEntries).omit({
  id: true,
  createdAt: true
});

export type InsertLogbookEntry = z.infer<typeof insertLogbookEntrySchema>;
export type LogbookEntry = typeof logbookEntries.$inferSelect;

// Community sightings table
export const communitySightings = pgTable("community_sightings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  bugName: text("bug_name").notNull(),
  scientificName: text("scientific_name"),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  additionalImageUrls: text("additional_image_urls").array(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  locationName: text("location_name"),
  rarity: text("rarity"),
  verified: boolean("verified").default(false),
  verifications: integer("verifications").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunitySightingSchema = createInsertSchema(communitySightings).omit({
  id: true,
  createdAt: true,
  verifications: true,
  verified: true,
});

export type InsertCommunitySighting = z.infer<typeof insertCommunitySightingSchema>;
export type CommunitySighting = typeof communitySightings.$inferSelect;

// Verification votes table
export const verificationVotes = pgTable("verification_votes", {
  id: serial("id").primaryKey(),
  sightingId: integer("sighting_id").notNull().references(() => communitySightings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  vote: boolean("vote").notNull(), // true for upvote, false for dispute
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVerificationVoteSchema = createInsertSchema(verificationVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationVote = z.infer<typeof insertVerificationVoteSchema>;
export type VerificationVote = typeof verificationVotes.$inferSelect;

// Adding geolocation and additional fields to logbook entries
export const logbookEntriesWithGeo = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  identificationId: integer("identification_id").notNull().references(() => bugIdentifications.id),
  notes: text("notes"),
  locationName: text("location_name"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  date: timestamp("date"),
  favorite: boolean("favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  weather: text("weather"),
  habitat: text("habitat"),
  behavior: text("behavior"),
  lifeCycle: text("life_cycle"),
  tags: text("tags").array(),
});

export const insertLogbookEntryWithGeoSchema = createInsertSchema(logbookEntriesWithGeo).omit({
  id: true,
  createdAt: true,
});

export type InsertLogbookEntryWithGeo = z.infer<typeof insertLogbookEntryWithGeoSchema>;
export type LogbookEntryWithGeo = typeof logbookEntriesWithGeo.$inferSelect;

export interface SaveToLogbookResponse {
  success: boolean;
  entry?: LogbookEntry;
  error?: string;
}

export interface CommunitySightingResponse {
  success: boolean;
  sighting?: CommunitySighting;
  error?: string;
}

export interface VerificationVoteResponse {
  success: boolean;
  vote?: VerificationVote;
  error?: string;
}

// Subscription schema for premium features
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(), // "monthly", "yearly"
  status: text("status").notNull(), // "active", "expired", "cancelled"
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  paymentId: text("payment_id").notNull(), // Google Pay transaction ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}
