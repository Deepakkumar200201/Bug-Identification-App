var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bugIdentifications: () => bugIdentifications,
  communitySightings: () => communitySightings,
  insertBugIdentificationSchema: () => insertBugIdentificationSchema,
  insertCommunitySightingSchema: () => insertCommunitySightingSchema,
  insertLogbookEntrySchema: () => insertLogbookEntrySchema,
  insertLogbookEntryWithGeoSchema: () => insertLogbookEntryWithGeoSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVerificationVoteSchema: () => insertVerificationVoteSchema,
  logbookEntries: () => logbookEntries,
  logbookEntriesWithGeo: () => logbookEntriesWithGeo,
  subscriptions: () => subscriptions,
  users: () => users,
  verificationVotes: () => verificationVotes
});
import { pgTable, text, serial, integer, timestamp, json, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var bugIdentifications = pgTable("bug_identifications", {
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
  threatLevel: text("threat_level"),
  // harmful/beneficial/neutral assessment
  pestControlRecommendations: text("pest_control_recommendations"),
  environmentalImpact: text("environmental_impact"),
  similarSpecies: json("similar_species"),
  conservationStatus: text("conservation_status"),
  identifiedAt: timestamp("identified_at").defaultNow().notNull(),
  alternativeMatches: json("alternative_matches")
});
var insertBugIdentificationSchema = createInsertSchema(bugIdentifications).omit({
  id: true,
  identifiedAt: true
});
var logbookEntries = pgTable("logbook_entries", {
  id: serial("id").primaryKey(),
  bugIdentificationId: integer("bug_identification_id").references(() => bugIdentifications.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
  location: text("location"),
  isFavorite: boolean("is_favorite").default(false)
});
var insertLogbookEntrySchema = createInsertSchema(logbookEntries).omit({
  id: true,
  createdAt: true
});
var communitySightings = pgTable("community_sightings", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertCommunitySightingSchema = createInsertSchema(communitySightings).omit({
  id: true,
  createdAt: true,
  verifications: true,
  verified: true
});
var verificationVotes = pgTable("verification_votes", {
  id: serial("id").primaryKey(),
  sightingId: integer("sighting_id").notNull().references(() => communitySightings.id),
  userId: integer("user_id").notNull().references(() => users.id),
  vote: boolean("vote").notNull(),
  // true for upvote, false for dispute
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertVerificationVoteSchema = createInsertSchema(verificationVotes).omit({
  id: true,
  createdAt: true
});
var logbookEntriesWithGeo = pgTable("logbook_entries", {
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
  tags: text("tags").array()
});
var insertLogbookEntryWithGeoSchema = createInsertSchema(logbookEntriesWithGeo).omit({
  id: true,
  createdAt: true
});
var subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planType: text("plan_type").notNull(),
  // "monthly", "yearly"
  status: text("status").notNull(),
  // "active", "expired", "cancelled"
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  paymentId: text("payment_id").notNull(),
  // Google Pay transaction ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, gte } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async saveIdentification(identification) {
    const [result] = await db.insert(bugIdentifications).values(identification).returning();
    return result;
  }
  async getIdentification(id) {
    const [result] = await db.select().from(bugIdentifications).where(eq(bugIdentifications.id, id));
    return result || void 0;
  }
  async getIdentifications(userId) {
    const query = db.select().from(bugIdentifications).orderBy(desc(bugIdentifications.identifiedAt));
    if (userId) {
      query.where(eq(bugIdentifications.userId, userId));
    }
    return await query;
  }
  async clearIdentifications(userId) {
    const query = db.delete(bugIdentifications);
    if (userId) {
      query.where(eq(bugIdentifications.userId, userId));
    }
    await query;
  }
  // Logbook methods
  async saveToLogbook(entry) {
    const [result] = await db.insert(logbookEntries).values(entry).returning();
    return result;
  }
  async getLogbookEntries(userId) {
    let baseQuery = db.select({
      logbook: logbookEntries,
      identification: bugIdentifications
    }).from(logbookEntries).innerJoin(
      bugIdentifications,
      eq(logbookEntries.bugIdentificationId, bugIdentifications.id)
    );
    const query = userId ? baseQuery.where(eq(bugIdentifications.userId, userId)) : baseQuery;
    const result = await query.orderBy(desc(logbookEntries.createdAt));
    return result.map((item) => ({
      ...item.logbook,
      identification: item.identification
    }));
  }
  async getLogbookEntry(id) {
    const [result] = await db.select({
      logbook: logbookEntries,
      identification: bugIdentifications
    }).from(logbookEntries).innerJoin(
      bugIdentifications,
      eq(logbookEntries.bugIdentificationId, bugIdentifications.id)
    ).where(eq(logbookEntries.id, id));
    if (!result) return void 0;
    return {
      ...result.logbook,
      identification: result.identification
    };
  }
  async deleteLogbookEntry(id) {
    const [result] = await db.delete(logbookEntries).where(eq(logbookEntries.id, id)).returning();
    return !!result;
  }
  async toggleFavorite(id) {
    const entry = await this.getLogbookEntry(id);
    if (!entry) return false;
    const [result] = await db.update(logbookEntries).set({ isFavorite: !entry.isFavorite }).where(eq(logbookEntries.id, id)).returning();
    return !!result;
  }
  // Methods for community and verification not implemented yet
  async updateLogbookEntry(id, entry) {
    const [result] = await db.update(logbookEntries).set(entry).where(eq(logbookEntries.id, id)).returning();
    return result;
  }
  // Mock implementations for the interface requirements
  async addCommunitySighting(sighting) {
    return {};
  }
  async getCommunitySightings(filters) {
    return [];
  }
  async getCommunitySighting(id) {
    return void 0;
  }
  async updateCommunitySighting(id, sighting) {
    return {};
  }
  async deleteCommunitySighting(id) {
    return true;
  }
  async addVerificationVote(vote) {
    return {};
  }
  async getVerificationVotes(sightingId) {
    return [];
  }
  async getUserVote(sightingId, userId) {
    return void 0;
  }
  async updateVerificationStatus(sightingId) {
    return true;
  }
  // Subscription methods
  async createSubscription(subscription) {
    const [result] = await db.insert(subscriptions).values(subscription).returning();
    return result;
  }
  async getSubscription(id) {
    const [result] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return result;
  }
  async getUserSubscription(userId) {
    const now = /* @__PURE__ */ new Date();
    const [result] = await db.select().from(subscriptions).where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gte(subscriptions.endDate, now)
      )
    ).orderBy(desc(subscriptions.startDate)).limit(1);
    return result;
  }
  async updateSubscription(id, data) {
    const [result] = await db.update(subscriptions).set(data).where(eq(subscriptions.id, id)).returning();
    return result;
  }
  async cancelSubscription(id) {
    const [result] = await db.update(subscriptions).set({
      status: "cancelled",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.id, id)).returning();
    return !!result;
  }
  async checkUserHasActiveSubscription(userId) {
    const now = /* @__PURE__ */ new Date();
    const [result] = await db.select().from(subscriptions).where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gte(subscriptions.endDate, now)
      )
    ).limit(1);
    return !!result;
  }
};
var storage = new DatabaseStorage();

// server/services/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { z } from "zod";
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set. Please provide an API key.");
      throw new Error("Missing API key for Gemini");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}
var identificationResponseSchema = z.object({
  name: z.string(),
  scientificName: z.string().optional(),
  confidence: z.number().min(0).max(100),
  type: z.string().optional(),
  habitat: z.string().optional(),
  harmLevel: z.string().optional(),
  description: z.string().optional(),
  size: z.string().optional(),
  diet: z.string().optional(),
  lifespan: z.string().optional(),
  // New enhanced information fields
  threatLevel: z.string().optional(),
  pestControlRecommendations: z.string().optional(),
  environmentalImpact: z.string().optional(),
  conservationStatus: z.string().optional(),
  similarSpecies: z.array(z.object({
    name: z.string(),
    scientificName: z.string(),
    imageUrl: z.string().optional(),
    differentiatingFeatures: z.string().optional(),
    commonlyConfusedWith: z.boolean().optional()
  })).optional(),
  alternativeMatches: z.array(z.object({
    name: z.string(),
    scientificName: z.string(),
    confidence: z.number().min(0).max(100)
  })).optional()
});
async function identifyBug(imageDataArray) {
  try {
    if (!imageDataArray.length) {
      console.error("No images provided");
      return null;
    }
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imageObjects = imageDataArray.map((imageData) => {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      return {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
          // Assuming JPEG, but could be detected more accurately
        }
      };
    });
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      }
    ];
    const prompt = `
      Identify the insect or bug in the image(s). Provide as much detail as possible including:
      - The common name
      - Scientific name (if known)
      - Physical characteristics
      - Habitat
      - Diet
      - Potential harm level (harmful, harmless, beneficial)
      - Typical size
      - Lifespan
      - Threat level assessment (harmful to humans, beneficial, or neutral)
      - Pest control recommendations (if it's a pest)
      - Environmental impact (how it affects the ecosystem)
      - Conservation status (endangered, threatened, common)
      - Similar species (what bugs it's commonly confused with)
      
      Also provide a confidence score (0-100) of how certain you are about this identification.
      
      If you're not completely certain, provide up to 3 alternative identifications with their scientific names and confidence scores.
      
      Return your response as a structured JSON object with these fields:
      {
        "name": "Common Bug Name",
        "scientificName": "Scientific Name (if known)",
        "confidence": 85, // 0-100 confidence score
        "type": "Type of bug (e.g., Beetle, Butterfly, etc.)",
        "habitat": "Where it's commonly found",
        "harmLevel": "Harmful/Harmless/Beneficial",
        "description": "A paragraph describing the bug",
        "size": "Size range in mm or cm",
        "diet": "What it eats",
        "lifespan": "Typical lifespan",
        
        // New fields for enhanced information
        "threatLevel": "Detailed assessment of whether the bug is harmful, beneficial, or neutral",
        "pestControlRecommendations": "If it's a pest, provide recommendations for control",
        "environmentalImpact": "How this bug affects the ecosystem - pollination, decomposition, etc.",
        "conservationStatus": "Conservation status - endangered, threatened, common, etc.",
        "similarSpecies": [
          {
            "name": "Similar Species 1",
            "scientificName": "Scientific Name",
            "differentiatingFeatures": "How to tell it apart from the identified bug",
            "commonlyConfusedWith": true
          }
        ],
        
        "alternativeMatches": [
          {
            "name": "Alternative Bug 1",
            "scientificName": "Scientific Name 1",
            "confidence": 65
          }
          // Additional alternatives if applicable
        ]
      }
      
      ONLY return a valid JSON object. Do not include any other text.
    `;
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [...imageObjects, { text: prompt }] }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
      }
    });
    const response = result.response;
    const text2 = response.text();
    let jsonResponse;
    try {
      const jsonMatch = text2.match(/```json\n([\s\S]*?)\n```/) || text2.match(/```\n([\s\S]*?)\n```/) || text2.match(/\{[\s\S]*?\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text2;
      jsonResponse = JSON.parse(jsonString.replace(/```json|```/g, "").trim());
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      console.log("Raw response:", text2);
      return null;
    }
    const validationResult = identificationResponseSchema.safeParse(jsonResponse);
    if (!validationResult.success) {
      console.error("Invalid response format:", validationResult.error);
      return null;
    }
    const validatedData = validationResult.data;
    const identification = {
      name: validatedData.name,
      scientificName: validatedData.scientificName,
      confidence: validatedData.confidence,
      imageUrl: imageDataArray[0],
      // Use first image as primary
      additionalImageUrls: imageDataArray.slice(1),
      // Rest as additional
      type: validatedData.type,
      habitat: validatedData.habitat,
      harmLevel: validatedData.harmLevel,
      description: validatedData.description,
      size: validatedData.size,
      diet: validatedData.diet,
      lifespan: validatedData.lifespan,
      // New enhanced information fields
      threatLevel: validatedData.threatLevel,
      pestControlRecommendations: validatedData.pestControlRecommendations,
      environmentalImpact: validatedData.environmentalImpact,
      conservationStatus: validatedData.conservationStatus,
      similarSpecies: validatedData.similarSpecies,
      alternativeMatches: validatedData.alternativeMatches
    };
    return identification;
  } catch (error) {
    console.error("Error in Gemini API:", error);
    return null;
  }
}

// server/services/weather.ts
import axios from "axios";
var API_BASE_URL = "https://api.openweathermap.org/data/2.5";
var API_KEY = process.env.WEATHER_API_KEY;
function getMockWeatherData(lat, lon) {
  const cityNames = ["Springfield", "Riverside", "Oakville", "Meadowbrook", "Cedar Creek"];
  const cityIndex = Math.floor(lat * lon % cityNames.length);
  if (cityIndex < 0) cityIndex * -1;
  const conditions = ["Clear", "Clouds", "Rain", "Mist", "Thunderstorm"];
  const conditionIndex = Math.floor((lat + lon) % conditions.length);
  const icons = ["01d", "03d", "10d", "50d", "11d"];
  const baseTemp = 15;
  const latEffect = (90 - Math.abs(lat)) / 3;
  const temp = Math.round(baseTemp + latEffect);
  return {
    location: cityNames[Math.abs(cityIndex)],
    temperature: temp,
    condition: conditions[Math.abs(conditionIndex)],
    humidity: Math.floor(50 + Math.sin(lat * lon) * 30),
    // 20-80 range
    windSpeed: Math.floor(3 + Math.cos(lat + lon) * 6),
    // 0-9 range
    iconUrl: `https://openweathermap.org/img/wn/${icons[Math.abs(conditionIndex)]}@2x.png`,
    timestamp: Date.now() / 1e3
    // current timestamp in seconds
  };
}
async function getWeatherByCoordinates(lat, lon) {
  if (!API_KEY) {
    console.warn("WEATHER_API_KEY environment variable is not set. Using mock weather data.");
    return getMockWeatherData(lat, lon);
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units: "metric",
        // Use metric units (Celsius)
        appid: API_KEY
      }
    });
    if (response.status !== 200) {
      console.warn(`Weather API returned status ${response.status}. Using mock weather data.`);
      return getMockWeatherData(lat, lon);
    }
    const data = response.data;
    return {
      location: data.name,
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      iconUrl: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      timestamp: data.dt
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    console.warn("Using mock weather data due to API error.");
    return getMockWeatherData(lat, lon);
  }
}
function getCurrentSeason(month, isNorthernHemisphere2 = true) {
  if (isNorthernHemisphere2) {
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "fall";
    return "winter";
  } else {
    if (month >= 3 && month <= 5) return "fall";
    if (month >= 6 && month <= 8) return "winter";
    if (month >= 9 && month <= 11) return "spring";
    return "summer";
  }
}
function isNorthernHemisphere(latitude) {
  return latitude >= 0;
}
function predictInsectActivity(weather, latitude) {
  const currentDate = /* @__PURE__ */ new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const hemisphere = isNorthernHemisphere(latitude);
  const season = getCurrentSeason(currentMonth, hemisphere);
  const isWarm = weather.temperature > 15;
  const isHot = weather.temperature > 28;
  const isRainy = weather.condition.toLowerCase().includes("rain");
  const isWindy = weather.windSpeed > 5;
  const isHumid = weather.humidity > 70;
  let overallActivity = "moderate";
  if (weather.temperature < 10) {
    overallActivity = "low";
  } else if (isHot && isHumid) {
    overallActivity = "high";
  } else if (isWarm && !isWindy && !isRainy) {
    overallActivity = "high";
  } else if (isRainy || isWindy) {
    overallActivity = "low";
  }
  let flyingActivity = "moderate";
  if (isWindy || isRainy) {
    flyingActivity = "low";
  } else if (isWarm && !isHot) {
    flyingActivity = "high";
  }
  let seasonalActivity = "moderate";
  let seasonalInsects = [];
  switch (season) {
    case "spring":
      seasonalActivity = isWarm && !isRainy ? "high" : "moderate";
      seasonalInsects = [
        "Butterflies",
        "Bees",
        "Ladybugs",
        "Aphids",
        "Beetles"
      ];
      break;
    case "summer":
      seasonalActivity = isHot && isHumid ? "high" : "moderate";
      seasonalInsects = [
        "Mosquitoes",
        "Flies",
        "Wasps",
        "Cicadas",
        "Dragonflies",
        "Grasshoppers"
      ];
      break;
    case "fall":
      seasonalActivity = isWarm ? "moderate" : "low";
      seasonalInsects = [
        "Spiders",
        "Stink Bugs",
        "Beetles",
        "Moths",
        "Crane Flies"
      ];
      break;
    case "winter":
      seasonalActivity = "low";
      seasonalInsects = [
        "Indoor Pests",
        "Overwintering Insects",
        "Some Spiders"
      ];
      break;
  }
  const recommendations = [];
  if (overallActivity === "high") {
    recommendations.push("Great conditions for insect spotting! Bring your camera and observation tools.");
  } else if (overallActivity === "low") {
    recommendations.push("Limited insect activity expected. Focus on sheltered areas where insects might take refuge.");
  }
  if (season === "spring") {
    recommendations.push("Look for pollinators around flowering plants and gardens.");
  } else if (season === "summer") {
    recommendations.push("Check near water sources for diverse insect activity.");
    if (isHot && isHumid) {
      recommendations.push("Higher mosquito activity likely - consider insect repellent.");
    }
  } else if (season === "fall") {
    recommendations.push("Focus on leaf litter and bark for insects preparing for winter.");
  } else if (season === "winter") {
    recommendations.push("Look under logs, rocks, and in protected areas for overwintering insects.");
  }
  if (isRainy) {
    recommendations.push("After rain stops, check wet areas for increased ground insect activity.");
  }
  if (weather.condition.toLowerCase().includes("clear") && isWarm) {
    recommendations.push("Clear conditions are perfect for observing flying insects like butterflies and dragonflies.");
  }
  return {
    overall: overallActivity,
    flying: flyingActivity,
    seasonal: {
      activity: seasonalActivity,
      insects: seasonalInsects
    },
    recommendations
  };
}
async function getWeatherAndInsectActivity(lat, lon) {
  try {
    const weatherData = await getWeatherByCoordinates(lat, lon);
    const activityPrediction = predictInsectActivity(weatherData, lat);
    return {
      weather: weatherData,
      insectActivity: activityPrediction
    };
  } catch (error) {
    console.error("Error getting weather and insect activity:", error);
    throw error;
  }
}

// server/routes.ts
import { z as z2 } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET || "bugidentifier-secret-key";
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Username already exists"
        });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Login after registration failed"
          });
        }
        res.status(201).json({
          success: true,
          user
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Registration failed"
      });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid username or password"
        });
      }
      req.login(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        return res.json({
          success: true,
          user
        });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Logout failed"
        });
      }
      res.json({
        success: true
      });
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      });
    }
    res.json(req.user);
  });
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    next();
  };
  return { requireAuth };
}

// server/routes.ts
var uploadDir = path.join(os.tmpdir(), "bug-identifier-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      return res.json({ success: true, subscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch subscription" });
    }
  });
  app2.post("/api/subscriptions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const schema = z2.object({
      planType: z2.enum(["monthly", "yearly"]),
      paymentId: z2.string(),
      endDate: z2.string().transform((val) => new Date(val))
    });
    try {
      const validatedData = schema.parse(req.body);
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planType: validatedData.planType,
        status: "active",
        startDate: /* @__PURE__ */ new Date(),
        endDate: validatedData.endDate,
        paymentId: validatedData.paymentId
      });
      return res.status(201).json({ success: true, subscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      return res.status(500).json({ success: false, error: "Failed to create subscription" });
    }
  });
  app2.post("/api/subscriptions/cancel/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ success: false, error: "Subscription not found" });
      }
      if (subscription.userId !== req.user.id) {
        return res.status(403).json({ success: false, error: "Not authorized to cancel this subscription" });
      }
      const success = await storage.cancelSubscription(subscriptionId);
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ success: false, error: "Failed to cancel subscription" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return res.status(500).json({ success: false, error: "Failed to cancel subscription" });
    }
  });
  app2.post("/api/google-pay/process-payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    try {
      const schema = z2.object({
        paymentData: z2.record(z2.any()),
        planType: z2.enum(["monthly", "yearly"])
      });
      const validatedData = schema.parse(req.body);
      const endDate = /* @__PURE__ */ new Date();
      if (validatedData.planType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      const paymentId = `googlepay_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planType: validatedData.planType,
        status: "active",
        startDate: /* @__PURE__ */ new Date(),
        endDate,
        paymentId
      });
      return res.status(201).json({
        success: true,
        subscription,
        paymentId
      });
    } catch (error) {
      console.error("Error processing Google Pay payment:", error);
      return res.status(500).json({ success: false, error: "Failed to process payment" });
    }
  });
  app2.get("/api/history", async (req, res) => {
    try {
      const userId = req.user?.id;
      const history = await storage.getIdentifications(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch identification history"
      });
    }
  });
  app2.delete("/api/history", async (req, res) => {
    try {
      const userId = req.user?.id;
      await storage.clearIdentifications(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear identification history"
      });
    }
  });
  app2.post("/api/identify", async (req, res) => {
    try {
      const schema = z2.object({
        image: z2.string().optional(),
        images: z2.array(z2.string()).optional()
      });
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data. Please provide valid image data."
        });
      }
      const { image, images } = validationResult.data;
      if (!image && (!images || images.length === 0)) {
        return res.status(400).json({
          success: false,
          error: "No images provided. Please provide at least one image."
        });
      }
      const imageArray = image ? [image] : images || [];
      const identificationResult = await identifyBug(imageArray);
      if (!identificationResult) {
        return res.status(500).json({
          success: false,
          error: "Failed to identify bug. Please try again with a clearer image."
        });
      }
      const userId = req.user?.id;
      const identificationWithUser = {
        ...identificationResult,
        userId
      };
      const savedIdentification = await storage.saveIdentification(identificationWithUser);
      res.json({
        success: true,
        identification: savedIdentification
      });
    } catch (error) {
      console.error("Error in bug identification:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred during identification. Please try again."
      });
    }
  });
  app2.get("/api/logbook", async (req, res) => {
    try {
      const userId = req.user?.id;
      const entries = await storage.getLogbookEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching logbook entries:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch logbook entries"
      });
    }
  });
  app2.get("/api/logbook/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID format"
        });
      }
      const entry = await storage.getLogbookEntry(id);
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: "Logbook entry not found"
        });
      }
      const userId = req.user?.id;
      if (entry.identification.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to access this entry"
        });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching logbook entry:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch logbook entry"
      });
    }
  });
  app2.post("/api/logbook", async (req, res) => {
    try {
      const validationResult = insertLogbookEntrySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data"
        });
      }
      const userId = req.user?.id;
      const entryWithUser = {
        ...validationResult.data,
        userId
      };
      const entry = await storage.saveToLogbook(entryWithUser);
      res.json({
        success: true,
        entry
      });
    } catch (error) {
      console.error("Error saving to logbook:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save to logbook"
      });
    }
  });
  app2.delete("/api/logbook/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID format"
        });
      }
      const entry = await storage.getLogbookEntry(id);
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: "Logbook entry not found"
        });
      }
      const userId = req.user?.id;
      if (entry.identification.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to delete this entry"
        });
      }
      const success = await storage.deleteLogbookEntry(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Failed to delete logbook entry"
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting logbook entry:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete logbook entry"
      });
    }
  });
  app2.patch("/api/logbook/:id/favorite", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID format"
        });
      }
      const entry = await storage.getLogbookEntry(id);
      if (!entry) {
        return res.status(404).json({
          success: false,
          error: "Logbook entry not found"
        });
      }
      const userId = req.user?.id;
      if (entry.identification.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to modify this entry"
        });
      }
      const success = await storage.toggleFavorite(id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Failed to update logbook entry"
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle favorite status"
      });
    }
  });
  app2.get("/api/weather-insect-activity", async (req, res) => {
    try {
      const schema = z2.object({
        lat: z2.string().transform((val) => parseFloat(val)),
        lon: z2.string().transform((val) => parseFloat(val))
      });
      const validationResult = schema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates. Please provide valid latitude and longitude."
        });
      }
      const { lat, lon } = validationResult.data;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({
          success: false,
          error: "Coordinates out of range. Latitude must be between -90 and 90, longitude between -180 and 180."
        });
      }
      const result = await getWeatherAndInsectActivity(lat, lon);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Error fetching weather and insect activity:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch weather and insect activity predictions."
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
