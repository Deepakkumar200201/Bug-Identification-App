import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Thermometer, Droplets, Wind, Bug, CloudRain, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  iconUrl: string;
  timestamp: number;
}

interface InsectActivityPrediction {
  overall: 'high' | 'moderate' | 'low';
  flying: 'high' | 'moderate' | 'low';
  seasonal: {
    activity: 'high' | 'moderate' | 'low';
    insects: string[];
  };
  recommendations: string[];
}

interface WeatherInsectData {
  weather: WeatherData;
  insectActivity: InsectActivityPrediction;
}

interface WeatherInsectPredictorProps {
  className?: string;
}

export function WeatherInsectPredictor({ className }: WeatherInsectPredictorProps) {
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState<{ lat: number, lon: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Function to get current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location error",
            description: "Could not retrieve your location. Please try again.",
            variant: "destructive",
          });
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    }
  };
  
  // Fetch weather and insect activity data when coordinates change
  const { 
    data: weatherInsectData,
    isLoading,
    isError,
    error
  } = useQuery<WeatherInsectData>({
    queryKey: ['/api/weather-insect-activity', coordinates?.lat, coordinates?.lon],
    queryFn: async () => {
      if (!coordinates) return Promise.reject("No coordinates provided");
      
      const response = await apiRequest(
        "GET", 
        `/api/weather-insect-activity?lat=${coordinates.lat}&lon=${coordinates.lon}`
      );
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || "Failed to fetch weather data");
      }
      
      return json.data;
    },
    enabled: !!coordinates,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
  
  // Helper function to render activity level
  const renderActivityLevel = (level: 'high' | 'moderate' | 'low') => {
    const bgColors = {
      high: "bg-green-100",
      moderate: "bg-yellow-100",
      low: "bg-gray-100",
    };
    
    const fillColors = {
      high: "bg-green-500",
      moderate: "bg-yellow-500",
      low: "bg-gray-400",
    };
    
    const values = {
      high: 100,
      moderate: 60,
      low: 30,
    };
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium capitalize">{level}</span>
          <span className="text-xs text-gray-500">
            {level === 'high' ? 'Excellent conditions' : 
              level === 'moderate' ? 'Good conditions' : 'Limited activity'}
          </span>
        </div>
        <div className={`h-2 rounded-full ${bgColors[level]}`}>
          <div 
            className={`h-full rounded-full ${fillColors[level]}`} 
            style={{ width: `${values[level]}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl md:text-2xl">Insect Activity Forecaster</CardTitle>
            <CardDescription className="text-blue-100">
              Weather-based predictions to help you find insects in your area
            </CardDescription>
          </div>
          {weatherInsectData?.weather && (
            <img 
              src={weatherInsectData.weather.iconUrl} 
              alt={weatherInsectData.weather.condition}
              className="w-16 h-16" 
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        {!coordinates ? (
          <div className="flex flex-col items-center justify-center py-8">
            <MapPin className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium text-center mb-2">
              Location needed for insect activity predictions
            </h3>
            <p className="text-gray-500 text-center mb-4 max-w-md">
              Share your location to see current weather conditions and insect activity predictions for your area.
            </p>
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Use my current location
                </>
              )}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Loading weather and insect activity data...</p>
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to load weather data. Please try again."}
            </AlertDescription>
          </Alert>
        ) : weatherInsectData ? (
          <div className="space-y-6">
            {/* Weather information */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <MapPin className="inline-block mr-2 h-5 w-5 text-blue-500" />
                Current conditions in {weatherInsectData.weather.location}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <Thermometer className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <div className="text-xl font-semibold">
                      {weatherInsectData.weather.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-sm text-gray-500">Temperature</div>
                  </div>
                </div>
                
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <Droplets className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <div className="text-xl font-semibold">
                      {weatherInsectData.weather.humidity}%
                    </div>
                    <div className="text-sm text-gray-500">Humidity</div>
                  </div>
                </div>
                
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <Wind className="h-8 w-8 text-cyan-500 mr-3" />
                  <div>
                    <div className="text-xl font-semibold">
                      {weatherInsectData.weather.windSpeed.toFixed(1)} m/s
                    </div>
                    <div className="text-sm text-gray-500">Wind Speed</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Insect activity information */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Bug className="inline-block mr-2 h-5 w-5 text-green-500" />
                Insect Activity Predictions
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Overall Insect Activity</label>
                  {renderActivityLevel(weatherInsectData.insectActivity.overall)}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Flying Insect Activity</label>
                  {renderActivityLevel(weatherInsectData.insectActivity.flying)}
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Seasonal Activity</label>
                  {renderActivityLevel(weatherInsectData.insectActivity.seasonal.activity)}
                </div>
              </div>
            </div>
            
            {/* Seasonal insects */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium mb-2 flex items-center">
                <Calendar className="inline-block mr-2 h-4 w-4 text-purple-500" />
                Seasonal Insects in Your Area
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {weatherInsectData.insectActivity.seasonal.insects.map((insect, index) => (
                  <Badge key={index} variant="outline" className="bg-white">
                    {insect}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-md font-medium mb-2 text-green-800">
                Recommendations for Insect Spotting
              </h4>
              <ul className="space-y-2">
                {weatherInsectData.insectActivity.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-green-700 flex">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}