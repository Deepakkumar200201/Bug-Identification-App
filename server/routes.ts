import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { identifyBug } from "./services/gemini";
import { getWeatherAndInsectActivity } from "./services/weather";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { insertLogbookEntrySchema } from "@shared/schema";
import { setupAuth } from "./auth";

// Set up multer for temporary storage
const uploadDir = path.join(os.tmpdir(), 'bug-identifier-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // API routes - prefix with /api
  
  // Subscription routes
  app.get('/api/subscriptions', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      return res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ success: false, error: "Failed to fetch subscription" });
    }
  });
  
  app.post('/api/subscriptions', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    
    const schema = z.object({
      planType: z.enum(["monthly", "yearly"]),
      paymentId: z.string(),
      endDate: z.string().transform(val => new Date(val))
    });
    
    try {
      const validatedData = schema.parse(req.body);
      
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planType: validatedData.planType,
        status: "active",
        startDate: new Date(),
        endDate: validatedData.endDate,
        paymentId: validatedData.paymentId
      });
      
      return res.status(201).json({ success: true, subscription });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return res.status(500).json({ success: false, error: "Failed to create subscription" });
    }
  });
  
  app.post('/api/subscriptions/cancel/:id', async (req, res) => {
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
      console.error('Error cancelling subscription:', error);
      return res.status(500).json({ success: false, error: "Failed to cancel subscription" });
    }
  });
  
  // Google Pay payment verification endpoint
  app.post('/api/google-pay/process-payment', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    
    try {
      const schema = z.object({
        paymentData: z.record(z.any()),
        planType: z.enum(["monthly", "yearly"])
      });
      
      const validatedData = schema.parse(req.body);
      
      // In a real implementation, you would validate the payment with Google's API
      // For now, we'll simulate a successful payment
      
      // Calculate subscription end date
      const endDate = new Date();
      if (validatedData.planType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // Generate a mock payment ID
      const paymentId = `googlepay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planType: validatedData.planType,
        status: "active",
        startDate: new Date(),
        endDate,
        paymentId
      });
      
      return res.status(201).json({ 
        success: true, 
        subscription,
        paymentId
      });
    } catch (error) {
      console.error('Error processing Google Pay payment:', error);
      return res.status(500).json({ success: false, error: "Failed to process payment" });
    }
  });
  
  // Get identification history
  app.get('/api/history', async (req, res) => {
    try {
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Only fetch identifications for the current user
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
  
  // Clear history
  app.delete('/api/history', async (req, res) => {
    try {
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Only clear identifications for the current user
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
  
  // Identify bug from base64 image
  app.post('/api/identify', async (req, res) => {
    try {
      const schema = z.object({
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
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
      
      // Process either single image or multiple images
      const imageArray = image ? [image] : images || [];
      
      // Call Gemini API to identify the bug
      const identificationResult = await identifyBug(imageArray);
      
      if (!identificationResult) {
        return res.status(500).json({ 
          success: false, 
          error: "Failed to identify bug. Please try again with a clearer image." 
        });
      }
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Add user ID to the identification data
      const identificationWithUser = {
        ...identificationResult,
        userId
      };
      
      // Store the identification in history
      const savedIdentification = await storage.saveIdentification(identificationWithUser);
      
      // Return the result
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

  // --- Logbook APIs ---
  
  // Get all logbook entries
  app.get('/api/logbook', async (req, res) => {
    try {
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Only fetch logbook entries for the current user
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
  
  // Get a specific logbook entry
  app.get('/api/logbook/:id', async (req, res) => {
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
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Check if the entry belongs to the current user
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
  
  // Save identification to logbook
  app.post('/api/logbook', async (req, res) => {
    try {
      const validationResult = insertLogbookEntrySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid request data" 
        });
      }
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Add user ID to the logbook entry data
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
  
  // Delete a logbook entry
  app.delete('/api/logbook/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid ID format" 
        });
      }
      
      // Get the logbook entry
      const entry = await storage.getLogbookEntry(id);
      if (!entry) {
        return res.status(404).json({ 
          success: false, 
          error: "Logbook entry not found" 
        });
      }
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Verify that the entry belongs to the current user
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
  
  // Toggle favorite status
  app.patch('/api/logbook/:id/favorite', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid ID format" 
        });
      }
      
      // Get the logbook entry
      const entry = await storage.getLogbookEntry(id);
      if (!entry) {
        return res.status(404).json({ 
          success: false, 
          error: "Logbook entry not found" 
        });
      }
      
      // Get the user ID from the authenticated session
      const userId = req.user?.id;
      
      // Verify that the entry belongs to the current user
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

  // --- Weather and Insect Activity APIs ---
  
  // Get weather and insect activity predictions for a location
  app.get('/api/weather-insect-activity', async (req, res) => {
    try {
      const schema = z.object({
        lat: z.string().transform(val => parseFloat(val)),
        lon: z.string().transform(val => parseFloat(val))
      });
      
      const validationResult = schema.safeParse(req.query);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates. Please provide valid latitude and longitude."
        });
      }
      
      const { lat, lon } = validationResult.data;
      
      // Validate coordinate ranges
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({
          success: false,
          error: "Coordinates out of range. Latitude must be between -90 and 90, longitude between -180 and 180."
        });
      }
      
      // Get weather data and insect activity predictions
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

  const httpServer = createServer(app);
  return httpServer;
}
