import { Button } from "@/components/ui/button";
import { Plus, Minus, MapPin } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onLocateMe }: MapControlsProps) {
  return (
    <div className="absolute bottom-28 right-6 flex flex-col">
      {/* Google Maps style zoom controls */}
      <div className="flex flex-col rounded-md shadow-lg overflow-hidden mb-4">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-none border-b border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
          onClick={onZoomIn}
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-10 w-10 rounded-none bg-white hover:bg-gray-50 text-gray-700"
          onClick={onZoomOut}
        >
          <Minus className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Google Maps style locate me button */}
      <Button 
        variant="secondary" 
        size="icon" 
        className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-gray-50 text-blue-500 flex items-center justify-center"
        onClick={onLocateMe}
      >
        <MapPin className="h-5 w-5" />
      </Button>
    </div>
  );
}
