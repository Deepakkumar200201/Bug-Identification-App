import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  isVisible: boolean;
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ isVisible, message, onRetry }: ErrorStateProps) {
  if (!isVisible) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="text-red-500 h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium mb-2">Identification Failed</h3>
        <p className="text-gray-600 mb-4">
          {message || "We couldn't identify the insect in the image. Try again with a clearer photo or from a different angle."}
        </p>
        <Button className="bg-primary text-white py-2 px-6 rounded-lg shadow-sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
