import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IdentifyBugResponse } from "@shared/schema";
import { Upload, Plus } from "lucide-react";

interface GalleryUploadProps {
  onIdentificationComplete: (result: IdentifyBugResponse) => void;
  onError: (error: Error) => void;
}

export function GalleryUpload({ onIdentificationComplete, onError }: GalleryUploadProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { toast } = useToast();
  
  const identifyMutation = useMutation({
    mutationFn: async (imageData: string[]) => {
      const response = await apiRequest("POST", "/api/identify", { images: imageData });
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
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: string[] = [];
    const maxImages = 4 - selectedImages.length;
    const filesToProcess = Math.min(files.length, maxImages);
    
    let processedCount = 0;
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result.toString());
          processedCount++;
          
          if (processedCount === filesToProcess) {
            setSelectedImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };
  
  const identifyBug = () => {
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image",
        variant: "destructive",
      });
      return;
    }
    
    identifyMutation.mutate(selectedImages);
  };
  
  return (
    <div>
      <div className="upload-area rounded-lg p-8 mb-6 flex flex-col items-center justify-center text-center">
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <h3 className="font-medium text-lg mb-1">Upload Photos</h3>
        <p className="text-gray-500 mb-4 text-sm">Select or drag and drop insect photos</p>
        <label className="bg-primary hover:bg-primary-dark text-white py-2 px-6 rounded-lg shadow-sm font-medium cursor-pointer transition-colors">
          Browse Files
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleFileUpload}
            disabled={selectedImages.length >= 4}
          />
        </label>
        <p className="text-xs text-gray-400 mt-3">Supports JPG, PNG, HEIC</p>
      </div>

      {/* Multi-angle Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h3 className="font-medium mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">360</span>
          Multiple Angle Analysis
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload multiple photos of the same insect from different angles for more accurate identification.
        </p>
        
        {/* Selected Images Preview */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array(4).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border relative"
            >
              {i < selectedImages.length ? (
                <>
                  <img 
                    src={selectedImages[i]} 
                    alt={`Selected bug image ${i + 1}`} 
                    className="h-full w-full object-cover rounded-lg"
                  />
                  <button 
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    onClick={() => removeImage(i)}
                  >
                    ×
                  </button>
                </>
              ) : (
                <Plus className="h-6 w-6 text-gray-400" />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{selectedImages.length}/4 images selected</span>
          <Button 
            className="bg-primary px-4 py-2 text-white rounded-lg shadow-sm font-medium"
            disabled={selectedImages.length === 0 || identifyMutation.isPending}
            onClick={identifyBug}
          >
            {identifyMutation.isPending ? "Identifying..." : "Identify"}
          </Button>
        </div>
      </div>
    </div>
  );
}
