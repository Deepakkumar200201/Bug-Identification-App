import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BugIdentification, 
  AlternativeMatch,
  InsertLogbookEntry,
  SimilarSpecies
} from "@shared/schema";
import { 
  X, 
  Share, 
  Bookmark, 
  BookmarkCheck, 
  Info, 
  Camera, 
  Map, 
  Edit
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface IdentificationResultsProps {
  identification: BugIdentification | null;
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onAddMorePhotos: () => void;
}

export function IdentificationResults({ 
  identification, 
  isVisible, 
  isLoading, 
  onClose,
  onAddMorePhotos
}: IdentificationResultsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [showLogbookForm, setShowLogbookForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Process data that might be used in hooks or conditionals
  const alternativeMatches = identification?.alternativeMatches 
    ? (identification.alternativeMatches as unknown as AlternativeMatch[]) 
    : [];
    
  const similarSpecies = identification?.similarSpecies
    ? (identification.similarSpecies as unknown as SimilarSpecies[])
    : [];
    
  const saveToLogbookMutation = useMutation({
    mutationFn: async (entry: InsertLogbookEntry) => {
      const response = await apiRequest("POST", "/api/logbook", entry);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logbook'] });
      toast({
        title: "Success!",
        description: "Bug identification saved to your logbook",
      });
      setShowLogbookForm(false);
      setNotes("");
      setLocation("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save to logbook. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Early return after all hooks are declared
  if (!isVisible) return null;
  
  const handleSaveToLogbook = () => {
    if (!identification) return;
    
    if (showLogbookForm) {
      // Save with notes and location
      const entry: InsertLogbookEntry = {
        bugIdentificationId: identification.id,
        notes,
        location,
        isFavorite: false
      };
      
      saveToLogbookMutation.mutate(entry);
    } else {
      // Show the form
      setShowLogbookForm(true);
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "rgb(34, 197, 94)"; // green-500
    if (confidence >= 60) return "rgb(234, 179, 8)";  // yellow-500
    return "rgb(239, 68, 68)"; // red-500
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-4 bg-primary text-white flex justify-between items-center">
        <h2 className="font-medium text-lg">Identification Results</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-primary-dark" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 mb-1">Identifying the insect...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      ) : (
        <div className="p-4">
          {identification && (
            <>
              {/* Main Identification Card */}
              <div className="flex flex-col rounded-lg overflow-hidden border shadow-sm mb-6">
                {/* Header with large name and confidence */}
                <div className="p-5 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-b">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-800">{identification.name}</h2>
                    {identification.scientificName && (
                      <p className="text-gray-500 italic">{identification.scientificName}</p>
                    )}
                  </div>
                  
                  {/* Large confidence indicator */}
                  <div className="w-24 h-24 relative flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#eee" 
                        strokeWidth="8"
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke={getConfidenceColor(identification.confidence)} 
                        strokeWidth="8"
                        strokeDasharray={`${Math.PI * 90 * identification.confidence / 100} ${Math.PI * 90}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <text 
                        x="50" 
                        y="50" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        fontSize="24" 
                        fontWeight="bold"
                        fill={getConfidenceColor(identification.confidence)}
                      >
                        {identification.confidence}%
                      </text>
                      <text 
                        x="50" 
                        y="70" 
                        textAnchor="middle" 
                        fontSize="10" 
                        fill="#666"
                      >
                        Confidence
                      </text>
                    </svg>
                  </div>
                </div>
                
                {/* Main content */}
                <div className="flex flex-col md:flex-row">
                  {/* Image Column */}
                  <div className="md:w-1/3 p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={identification.imageUrl} 
                        alt={`Identified insect - ${identification.name}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex space-x-2 mt-2">
                      {identification.additionalImageUrls?.slice(0, 3).map((img, i) => (
                        <div key={i} className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shadow-sm">
                          <img 
                            src={img} 
                            alt={`Additional angle of ${identification.name}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="h-16 w-16 rounded-lg flex items-center justify-center"
                        onClick={onAddMorePhotos}
                      >
                        <Camera className="h-5 w-5 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Info Column */}
                  <div className="md:w-2/3 p-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {identification.type && (
                        <span className="px-3 py-1 bg-primary-light bg-opacity-20 text-primary-dark rounded-full text-sm font-medium">
                          {identification.type}
                        </span>
                      )}
                      {identification.habitat && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {identification.habitat}
                        </span>
                      )}
                      {identification.harmLevel && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {identification.harmLevel}
                        </span>
                      )}
                    </div>
                    
                    {/* Description */}
                    {identification.description && (
                      <div className="mb-4">
                        <p className="text-gray-700">{identification.description}</p>
                      </div>
                    )}
                    
                    {/* Basic Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {identification.size && (
                        <div className="flex items-center">
                          <span className="w-24 flex-shrink-0 text-gray-600 font-medium">Size:</span>
                          <span className="text-gray-800">{identification.size}</span>
                        </div>
                      )}
                      {identification.diet && (
                        <div className="flex items-center">
                          <span className="w-24 flex-shrink-0 text-gray-600 font-medium">Diet:</span>
                          <span className="text-gray-800">{identification.diet}</span>
                        </div>
                      )}
                      {identification.lifespan && (
                        <div className="flex items-center">
                          <span className="w-24 flex-shrink-0 text-gray-600 font-medium">Lifespan:</span>
                          <span className="text-gray-800">{identification.lifespan}</span>
                        </div>
                      )}
                      {identification.conservationStatus && (
                        <div className="flex items-center">
                          <span className="w-24 flex-shrink-0 text-gray-600 font-medium">Status:</span>
                          <span className="text-gray-800">{identification.conservationStatus}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Information */}
                    {(identification.threatLevel || identification.pestControlRecommendations || identification.environmentalImpact) && (
                      <div className="mt-6 border-t pt-4">
                        <h4 className="font-medium mb-3">Enhanced Information</h4>
                        
                        {identification.threatLevel && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Threat Assessment</h5>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{identification.threatLevel}</p>
                          </div>
                        )}
                        
                        {identification.pestControlRecommendations && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Pest Control</h5>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{identification.pestControlRecommendations}</p>
                          </div>
                        )}
                        
                        {identification.environmentalImpact && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Environmental Impact</h5>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{identification.environmentalImpact}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Logbook Form - only shown when user clicks Save to Logbook */}
              {showLogbookForm && (
                <div className="border rounded-lg p-4 mb-6 bg-blue-50">
                  <h4 className="font-medium mb-3 flex items-center text-blue-800">
                    <BookmarkCheck className="mr-2 h-5 w-5" />
                    Save to Logbook
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Location
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={location} 
                          onChange={(e) => setLocation(e.target.value)} 
                          placeholder="Where did you find this bug?" 
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                          title="Use current location"
                        >
                          <Map className="h-4 w-4 text-blue-700" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Notes
                      </label>
                      <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Add any observations or notes about this bug..." 
                        rows={3} 
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-wrap gap-3 mb-2">
                <Button 
                  variant={showLogbookForm ? "default" : "outline"} 
                  className="flex items-center" 
                  onClick={handleSaveToLogbook}
                  disabled={saveToLogbookMutation.isPending}
                >
                  {saveToLogbookMutation.isPending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    showLogbookForm ? (
                      <BookmarkCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-2 h-4 w-4" />
                    )
                  )}
                  {showLogbookForm ? "Save Entry" : "Save to Logbook"}
                </Button>
                
                <Button variant="outline" className="flex items-center">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
                >
                  <Info className="mr-2 h-4 w-4" />
                  More Info
                </Button>
              </div>
            </>
          )}
          
          {/* Similar Species Section */}
          {similarSpecies.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Similar Species</h4>
              <div className="grid grid-cols-1 gap-3">
                {similarSpecies.map((species, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 p-3 bg-gray-50">
                        <h5 className="font-medium text-sm">{species.name}</h5>
                        <p className="text-xs text-gray-500 italic mb-2">{species.scientificName}</p>
                        {species.commonlyConfusedWith && (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            Commonly confused
                          </span>
                        )}
                      </div>
                      <div className="md:w-3/4 p-3">
                        {species.differentiatingFeatures && (
                          <div>
                            <h6 className="text-xs font-medium text-gray-700 mb-1">How to tell them apart:</h6>
                            <p className="text-sm text-gray-700">{species.differentiatingFeatures}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Alternative Matches Section */}
          {alternativeMatches && alternativeMatches.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Alternative Matches</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {alternativeMatches.map((match, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="h-24 bg-gray-100 relative">
                      {match.imageUrl ? (
                        <img 
                          src={match.imageUrl} 
                          alt={match.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                        {match.confidence}%
                      </div>
                    </div>
                    <div className="p-3">
                      <h5 className="font-medium text-sm">{match.name}</h5>
                      <p className="text-xs text-gray-500 italic">{match.scientificName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}