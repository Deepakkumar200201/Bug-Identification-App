import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { Camera, SwitchCamera, FlashlightOff, Camera as CameraIcon, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCamera } from "@/hooks/use-camera";
import { useMutation } from "@tanstack/react-query";
import { IdentifyBugResponse } from "@shared/schema";

interface CameraViewProps {
  onIdentificationComplete: (result: IdentifyBugResponse) => void;
  onError: (error: Error) => void;
}

export function CameraView({ onIdentificationComplete, onError }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();
  const { hasPermission, requestPermission, isLoading } = useCamera();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const identifyMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/identify", { image: imageData });
      return await response.json() as IdentifyBugResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.identification) {
        onIdentificationComplete(data);
      } else {
        onError(new Error(data.error || "Failed to identify bug"));
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to identify bug. Please try again.",
        variant: "destructive",
      });
      onError(error as Error);
    }
  });
  
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        toast({
          title: "Photo Captured",
          description: "Now click 'Identify Bug' to analyze the image",
        });
      }
    }
  };
  
  const identifyBug = () => {
    if (!capturedImage) {
      toast({
        title: "No image captured",
        description: "Please capture an image first",
        variant: "destructive",
      });
      return;
    }
    
    identifyMutation.mutate(capturedImage);
  };
  
  if (!hasPermission) {
    return (
      <div className="block">
        <div className="camera-container bg-gray-900 rounded-lg mx-auto mb-4 flex items-center justify-center relative">
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <CameraIcon className="h-16 w-16 text-gray-400" />
          </div>
          
          <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center px-6 py-4">
            <Camera className="h-12 w-12 text-white mb-4" />
            <h3 className="text-white text-lg font-medium mb-2 text-center">Camera access required</h3>
            <p className="text-gray-300 text-center mb-4">
              Please allow camera access to identify bugs in real-time
            </p>
            <Button 
              className="bg-primary px-6 py-2 rounded-lg text-white font-medium"
              onClick={requestPermission}
              disabled={isLoading}
            >
              {isLoading ? "Requesting..." : "Enable Camera"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="block">
      <div className="camera-container bg-gray-900 rounded-lg mx-auto mb-4 flex items-center justify-center relative">
        {/* Camera Feed */}
        {!capturedImage ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment",
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
        
        {/* Camera Controls */}
        <div className="absolute bottom-4 w-full px-4 flex justify-center space-x-4">
          <Button 
            className="bg-white rounded-full p-3 shadow-lg" 
            variant="outline" 
            size="icon"
            aria-label="Flash"
          >
            <FlashlightOff className="text-gray-800 h-5 w-5" />
          </Button>
          <Button 
            className="bg-primary rounded-full p-4 shadow-lg" 
            size="icon"
            aria-label="Take Photo" 
            onClick={capturePhoto}
          >
            <Camera className="text-white h-6 w-6" />
          </Button>
          <Button 
            className="bg-white rounded-full p-3 shadow-lg" 
            variant="outline" 
            size="icon"
            aria-label="Switch Camera"
          >
            <SwitchCamera className="text-gray-800 h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 mb-2">Position the insect in the center of the frame</p>
        <Button 
          className="bg-primary text-white py-3 px-6 rounded-lg shadow-md font-medium"
          onClick={identifyBug}
          disabled={identifyMutation.isPending || !capturedImage}
        >
          {identifyMutation.isPending ? "Identifying..." : "Identify Bug"}
        </Button>
      </div>
      
      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-4 mt-4">
        <h3 className="font-medium text-blue-800 flex items-center mb-2">
          <Info className="mr-2 h-5 w-5 text-blue-800" />
          Tips for better identification
        </h3>
        <ul className="text-blue-700 text-sm pl-6 list-disc">
          <li>Ensure good lighting for clearer images</li>
          <li>Try to capture multiple angles of the insect</li>
          <li>Keep the camera steady for sharp images</li>
          <li>Capture close-ups when possible</li>
        </ul>
      </div>
    </div>
  );
}
