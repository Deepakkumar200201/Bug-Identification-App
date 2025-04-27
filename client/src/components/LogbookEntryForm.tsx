import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BugIdentification } from "@shared/schema";
import { 
  MapPin, 
  Calendar, 
  Cloud, 
  Leaf, 
  Activity, 
  Egg 
} from "lucide-react";

interface LogbookEntryFormProps {
  identification: BugIdentification | null;
  isOpen: boolean;
  onClose: () => void;
}

interface GeolocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export function LogbookEntryForm({ identification, isOpen, onClose }: LogbookEntryFormProps) {
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [formData, setFormData] = useState({
    notes: "",
    locationName: "",
    latitude: null as number | null,
    longitude: null as number | null,
    date: new Date().toISOString().split("T")[0],
    weather: "",
    habitat: "",
    behavior: "",
    lifeCycle: "",
    tags: ""
  });

  // Reset form when opening the dialog
  useEffect(() => {
    if (isOpen) {
      setFormData({
        notes: "",
        locationName: "",
        latitude: null,
        longitude: null,
        date: new Date().toISOString().split("T")[0],
        weather: "",
        habitat: "",
        behavior: "",
        lifeCycle: "",
        tags: ""
      });
      setLocationError("");
    }
  }, [isOpen]);

  const saveLogbookMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", "/api/logbook", {
        ...formData,
        identificationId: identification?.id,
        // Convert tags string to array
        tags: formData.tags ? formData.tags.split(",").map((tag: string) => tag.trim()) : []
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Entry saved",
          description: "Your logbook entry has been saved successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/logbook"] });
        onClose();
      } else {
        toast({
          title: "Error saving entry",
          description: data.error || "Failed to save logbook entry",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveLogbookMutation.mutate(formData);
  };

  const getGeolocation = () => {
    setIsGettingLocation(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const locationData = await fetchLocationName(
            position.coords.latitude, 
            position.coords.longitude
          );
          
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationName: locationData.locationName
          }));
          setIsGettingLocation(false);
        } catch (error) {
          console.error("Error fetching location name:", error);
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(
          error.code === 1 
            ? "Location permission denied" 
            : "Unable to get your location"
        );
        setIsGettingLocation(false);
      }
    );
  };
  
  // Function to fetch location name from coordinates
  const fetchLocationName = async (
    latitude: number,
    longitude: number
  ): Promise<GeolocationData> => {
    try {
      // This is a simplified example - in a real app, you'd use a geocoding service API
      // like Google Maps Geocoding API, OpenStreetMap Nominatim, etc.
      
      // For demo purposes, we'll use OpenStreetMap Nominatim, but in production
      // you should use a properly authenticated service with appropriate rate limiting
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en-US,en",
            "User-Agent": "BugIdentifierApp/1.0" // Required by Nominatim's terms
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }
      
      const data = await response.json();
      
      // Format location name based on available data
      let locationName = "Unknown location";
      
      if (data.address) {
        const parts = [];
        
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city) parts.push(data.address.city);
        else if (data.address.town) parts.push(data.address.town);
        else if (data.address.village) parts.push(data.address.village);
        
        if (data.address.state) parts.push(data.address.state);
        if (data.address.country) parts.push(data.address.country);
        
        locationName = parts.join(", ");
      }
      
      return {
        latitude,
        longitude,
        locationName
      };
    } catch (error) {
      console.error("Error in geocoding:", error);
      return {
        latitude,
        longitude,
        locationName: "Location name unavailable"
      };
    }
  };

  const habitatOptions = [
    "Forest", "Grassland", "Desert", "Urban", "Aquatic", 
    "Garden", "Wetland", "Mountain", "Coastal", "Agricultural"
  ];
  
  const lifeCycleOptions = [
    "Egg", "Larva", "Nymph", "Pupa", "Adult"
  ];
  
  const weatherOptions = [
    "Sunny", "Cloudy", "Rainy", "Foggy", "Windy", "Snowy", "Hot", "Cold"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save to Logbook</DialogTitle>
          <DialogDescription>
            Record details about your {identification?.name} sighting.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add your observations and notes about this bug..."
              value={formData.notes}
              onChange={handleInputChange}
              className="min-h-[100px]"
            />
          </div>
          
          {/* Location section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <Label htmlFor="locationName" className="text-base font-medium">Location</Label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <Input
                  id="locationName"
                  name="locationName"
                  placeholder="Location name"
                  value={formData.locationName}
                  onChange={handleInputChange}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={getGeolocation}
                disabled={isGettingLocation}
                className="sm:col-span-1"
              >
                {isGettingLocation ? "Getting..." : "Get Location"}
              </Button>
            </div>
            
            {locationError && (
              <p className="text-sm text-red-500">{locationError}</p>
            )}
            
            {(formData.latitude && formData.longitude) && (
              <p className="text-sm text-gray-500">
                Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
              </p>
            )}
          </div>
          
          {/* Date and Weather */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <Label htmlFor="date" className="text-base font-medium">Date</Label>
              </div>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Weather */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-gray-500" />
                <Label htmlFor="weather" className="text-base font-medium">Weather</Label>
              </div>
              <Select 
                onValueChange={(value) => handleSelectChange("weather", value)} 
                value={formData.weather}
              >
                <SelectTrigger id="weather">
                  <SelectValue placeholder="Select weather condition" />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Habitat and Behavior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Habitat */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-gray-500" />
                <Label htmlFor="habitat" className="text-base font-medium">Habitat</Label>
              </div>
              <Select 
                onValueChange={(value) => handleSelectChange("habitat", value)} 
                value={formData.habitat}
              >
                <SelectTrigger id="habitat">
                  <SelectValue placeholder="Select habitat type" />
                </SelectTrigger>
                <SelectContent>
                  {habitatOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Behavior */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-500" />
                <Label htmlFor="behavior" className="text-base font-medium">Behavior</Label>
              </div>
              <Input
                id="behavior"
                name="behavior"
                placeholder="e.g., Flying, Feeding, Mating"
                value={formData.behavior}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {/* Life Cycle and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Life Cycle */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Egg className="h-5 w-5 text-gray-500" />
                <Label htmlFor="lifeCycle" className="text-base font-medium">Life Cycle Stage</Label>
              </div>
              <Select 
                onValueChange={(value) => handleSelectChange("lifeCycle", value)} 
                value={formData.lifeCycle}
              >
                <SelectTrigger id="lifeCycle">
                  <SelectValue placeholder="Select life cycle stage" />
                </SelectTrigger>
                <SelectContent>
                  {lifeCycleOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-base font-medium">Tags</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., rare, colorful, predator (comma separated)"
                value={formData.tags}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saveLogbookMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {saveLogbookMutation.isPending ? "Saving..." : "Save to Logbook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}