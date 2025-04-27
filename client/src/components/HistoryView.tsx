import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BugIdentification } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, History, ArrowRight, LogIn, FolderSearch } from "lucide-react";

import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface HistoryViewProps {
  onSelectIdentification: (identification: BugIdentification) => void;
}

export function HistoryView({ onSelectIdentification }: HistoryViewProps) {
  const queryClient = useQueryClient();
  // Mock user for history display
  const user = { id: 1 };
  
  const { data: historyItems = [], isLoading } = useQuery<BugIdentification[]>({
    queryKey: ['/api/history'],
    enabled: !!user, // Only run this query if user is logged in
  });
  
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/history", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/history'] });
    }
  });
  
  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-medium">Recent Identifications</h3>
        {user && historyItems.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-primary flex items-center"
            onClick={handleClearHistory}
            disabled={clearHistoryMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear History
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 inline-block p-3 rounded-full mb-4">
            <FolderSearch className="h-6 w-6 text-gray-400" />
          </div>
          <h4 className="font-medium mb-1">No history yet</h4>
          <p className="text-gray-500 text-sm">Your identified insects will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border rounded-lg p-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onSelectIdentification(item)}
            >
              <div className="h-16 w-16 bg-gray-200 rounded-lg mr-3 overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-xs text-gray-500">
                  {item.identifiedAt ? formatDistanceToNow(new Date(item.identifiedAt), { addSuffix: true }) : 'Unknown date'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-primary">{item.confidence}%</span>
                <Button variant="ghost" size="sm" className="text-gray-400 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
