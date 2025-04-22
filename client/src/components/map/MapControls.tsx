import { Button } from "@/components/ui/button";
import { Plus, Minus, MapPin } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onLocateMe }: MapControlsProps) {
  return (
    <div className="absolute top-6 right-6 flex flex-col space-y-2">
      <Button 
        variant="secondary" 
        size="icon" 
        className="h-10 w-10 rounded-lg shadow-md bg-white hover:bg-gray-50 text-gray-700"
        onClick={onZoomIn}
      >
        <Plus className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="secondary" 
        size="icon" 
        className="h-10 w-10 rounded-lg shadow-md bg-white hover:bg-gray-50 text-gray-700"
        onClick={onZoomOut}
      >
        <Minus className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="secondary" 
        size="icon" 
        className="h-10 w-10 rounded-lg shadow-md bg-white hover:bg-gray-50 text-gray-700"
        onClick={onLocateMe}
      >
        <MapPin className="h-5 w-5" />
      </Button>
    </div>
  );
}
