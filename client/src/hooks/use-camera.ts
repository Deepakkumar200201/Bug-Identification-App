import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useCamera() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check for camera permissions on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Function to check camera permissions
  const checkCameraPermission = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        toast({
          title: "No camera detected",
          description: "Your device doesn't appear to have a camera",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setHasPermission(false);
      }
    } catch (error) {
      console.error("Error checking camera permissions:", error);
      setHasPermission(false);
    }
  };

  // Function to request camera permission
  const requestPermission = async () => {
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      
      // Clean up stream tracks
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Camera access granted",
        description: "You can now use the camera to identify bugs",
      });
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      
      toast({
        title: "Camera access denied",
        description: "Please allow camera access in your browser settings to use this feature",
        variant: "destructive",
      });
      
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    requestPermission,
    isLoading,
  };
}
