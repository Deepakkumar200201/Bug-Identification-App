import { 
  bugIdentifications, 
  type BugIdentification, 
  type InsertBugIdentification,
  logbookEntries,
  type LogbookEntry,
  type InsertLogbookEntry,
  subscriptions,
  type Subscription,
  type InsertSubscription,
  users,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lt, gte } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bug identification methods
  saveIdentification(identification: InsertBugIdentification): Promise<BugIdentification>;
  getIdentification(id: number): Promise<BugIdentification | undefined>;
  getIdentifications(userId?: number): Promise<BugIdentification[]>;
  clearIdentifications(userId?: number): Promise<void>;
  
  // Logbook methods
  saveToLogbook(entry: InsertLogbookEntry): Promise<LogbookEntry>;
  getLogbookEntries(userId?: number): Promise<(LogbookEntry & { identification: BugIdentification })[]>;
  getLogbookEntry(id: number): Promise<(LogbookEntry & { identification: BugIdentification }) | undefined>;
  deleteLogbookEntry(id: number): Promise<boolean>;
  toggleFavorite(id: number): Promise<boolean>;
  updateLogbookEntry(id: number, entry: Partial<InsertLogbookEntry>): Promise<LogbookEntry>;
  
  // Community sightings methods
  addCommunitySighting(sighting: any): Promise<any>;
  getCommunitySightings(
    filters?: { 
      verified?: boolean, 
      userId?: number, 
      rarity?: string 
    }
  ): Promise<any[]>;
  getCommunitySighting(id: number): Promise<any | undefined>;
  updateCommunitySighting(id: number, sighting: any): Promise<any>;
  deleteCommunitySighting(id: number): Promise<boolean>;
  
  // Verification methods
  addVerificationVote(vote: any): Promise<any>;
  getVerificationVotes(sightingId: number): Promise<any[]>;
  getUserVote(sightingId: number, userId: number): Promise<any | undefined>;
  updateVerificationStatus(sightingId: number): Promise<boolean>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription>;
  cancelSubscription(id: number): Promise<boolean>;
  checkUserHasActiveSubscription(userId: number): Promise<boolean>;
}



export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async saveIdentification(identification: InsertBugIdentification): Promise<BugIdentification> {
    const [result] = await db
      .insert(bugIdentifications)
      .values(identification)
      .returning();
    return result;
  }
  
  async getIdentification(id: number): Promise<BugIdentification | undefined> {
    const [result] = await db
      .select()
      .from(bugIdentifications)
      .where(eq(bugIdentifications.id, id));
    return result || undefined;
  }
  
  async getIdentifications(userId?: number): Promise<BugIdentification[]> {
    const query = db
      .select()
      .from(bugIdentifications)
      .orderBy(desc(bugIdentifications.identifiedAt));
      
    if (userId) {
      query.where(eq(bugIdentifications.userId, userId));
    }
    
    return await query;
  }
  
  async clearIdentifications(userId?: number): Promise<void> {
    const query = db.delete(bugIdentifications);
    
    if (userId) {
      query.where(eq(bugIdentifications.userId, userId));
    }
    
    await query;
  }
  
  // Logbook methods
  async saveToLogbook(entry: InsertLogbookEntry): Promise<LogbookEntry> {
    const [result] = await db
      .insert(logbookEntries)
      .values(entry)
      .returning();
    return result;
  }
  
  async getLogbookEntries(userId?: number): Promise<(LogbookEntry & { identification: BugIdentification })[]> {
    let baseQuery = db
      .select({
        logbook: logbookEntries,
        identification: bugIdentifications
      })
      .from(logbookEntries)
      .innerJoin(
        bugIdentifications,
        eq(logbookEntries.bugIdentificationId, bugIdentifications.id)
      );
    
    // Create the filtered query if needed
    const query = userId 
      ? baseQuery.where(eq(bugIdentifications.userId, userId))
      : baseQuery;
    
    const result = await query.orderBy(desc(logbookEntries.createdAt));
      
    return result.map(item => ({
      ...item.logbook,
      identification: item.identification
    }));
  }
  
  async getLogbookEntry(id: number): Promise<(LogbookEntry & { identification: BugIdentification }) | undefined> {
    const [result] = await db
      .select({
        logbook: logbookEntries,
        identification: bugIdentifications
      })
      .from(logbookEntries)
      .innerJoin(
        bugIdentifications,
        eq(logbookEntries.bugIdentificationId, bugIdentifications.id)
      )
      .where(eq(logbookEntries.id, id));
      
    if (!result) return undefined;
    
    return {
      ...result.logbook,
      identification: result.identification
    };
  }
  
  async deleteLogbookEntry(id: number): Promise<boolean> {
    const [result] = await db
      .delete(logbookEntries)
      .where(eq(logbookEntries.id, id))
      .returning();
    return !!result;
  }
  
  async toggleFavorite(id: number): Promise<boolean> {
    const entry = await this.getLogbookEntry(id);
    if (!entry) return false;
    
    const [result] = await db
      .update(logbookEntries)
      .set({ isFavorite: !entry.isFavorite })
      .where(eq(logbookEntries.id, id))
      .returning();
    
    return !!result;
  }

  // Methods for community and verification not implemented yet
  async updateLogbookEntry(id: number, entry: Partial<InsertLogbookEntry>): Promise<LogbookEntry> {
    const [result] = await db
      .update(logbookEntries)
      .set(entry)
      .where(eq(logbookEntries.id, id))
      .returning();
    return result;
  }

  // Mock implementations for the interface requirements
  async addCommunitySighting(sighting: any): Promise<any> { return {}; }
  async getCommunitySightings(filters?: any): Promise<any[]> { return []; }
  async getCommunitySighting(id: number): Promise<any | undefined> { return undefined; }
  async updateCommunitySighting(id: number, sighting: any): Promise<any> { return {}; }
  async deleteCommunitySighting(id: number): Promise<boolean> { return true; }
  
  async addVerificationVote(vote: any): Promise<any> { return {}; }
  async getVerificationVotes(sightingId: number): Promise<any[]> { return []; }
  async getUserVote(sightingId: number, userId: number): Promise<any | undefined> { return undefined; }
  async updateVerificationStatus(sightingId: number): Promise<boolean> { return true; }

  // Subscription methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [result] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return result;
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return result;
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const now = new Date();
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.endDate, now)
        )
      )
      .orderBy(desc(subscriptions.startDate))
      .limit(1);
    return result;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [result] = await db
      .update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
    return result;
  }

  async cancelSubscription(id: number): Promise<boolean> {
    const [result] = await db
      .update(subscriptions)
      .set({ 
        status: "cancelled",
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return !!result;
  }

  async checkUserHasActiveSubscription(userId: number): Promise<boolean> {
    const now = new Date();
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.endDate, now)
        )
      )
      .limit(1);
    return !!result;
  }
}

export const storage = new DatabaseStorage();
