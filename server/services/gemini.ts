import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { InsertBugIdentification, AlternativeMatch, SimilarSpecies } from "@shared/schema";
import { z } from "zod";

// Create a reusable Gemini client that will be initialized only once
let geminiClient: GoogleGenerativeAI | null = null;

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

// Schema for the Gemini API response
const identificationResponseSchema = z.object({
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
    commonlyConfusedWith: z.boolean().optional(),
  })).optional(),
  alternativeMatches: z.array(z.object({
    name: z.string(),
    scientificName: z.string(),
    confidence: z.number().min(0).max(100),
  })).optional(),
});

/**
 * Identifies a bug from one or more images using the Gemini API
 * @param imageDataArray Array of base64 image data strings
 * @returns Bug identification result or null if identification failed
 */
export async function identifyBug(imageDataArray: string[]): Promise<InsertBugIdentification | null> {
  try {
    if (!imageDataArray.length) {
      console.error("No images provided");
      return null;
    }
    
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Process images for the API
    const imageObjects = imageDataArray.map(imageData => {
      // Remove the data:image prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      return {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg" // Assuming JPEG, but could be detected more accurately
        }
      };
    });
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Prompt engineering for better results
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
    
    // Generate content with the Gemini model
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [...imageObjects, { text: prompt }] }
      ],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
    
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    let jsonResponse;
    try {
      // Extract JSON if it's wrapped in code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/```\n([\s\S]*?)\n```/) ||
                         text.match(/\{[\s\S]*?\}/);
                         
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      jsonResponse = JSON.parse(jsonString.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      console.log("Raw response:", text);
      return null;
    }
    
    // Validate with zod schema
    const validationResult = identificationResponseSchema.safeParse(jsonResponse);
    
    if (!validationResult.success) {
      console.error("Invalid response format:", validationResult.error);
      return null;
    }
    
    const validatedData = validationResult.data;
    
    // Create the identification result
    const identification: InsertBugIdentification = {
      name: validatedData.name,
      scientificName: validatedData.scientificName,
      confidence: validatedData.confidence,
      imageUrl: imageDataArray[0], // Use first image as primary
      additionalImageUrls: imageDataArray.slice(1), // Rest as additional
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
      similarSpecies: validatedData.similarSpecies as unknown as any,
      alternativeMatches: validatedData.alternativeMatches as unknown as any
    };
    
    return identification;
    
  } catch (error) {
    console.error("Error in Gemini API:", error);
    return null;
  }
}
