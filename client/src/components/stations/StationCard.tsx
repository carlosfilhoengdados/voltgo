import { Station } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StationCardProps {
  station: Station;
  onClick: (station: Station) => void;
  selected?: boolean;
}

export default function StationCard({ station, onClick, selected = false }: StationCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [promotion, setPromotion] = useState<string | null>(null);

  useEffect(() => {
    // Check if station is favorite for current user
    if (user) {
      apiRequest("GET", `/api/favorites/check/${station.id}`)
        .then(res => res.json())
        .then(data => setIsFavorite(data.isFavorite))
        .catch(err => console.error("Error checking favorite status", err));
    }

    // Get station promotions
    apiRequest("GET", `/api/stations/${station.id}/promotions`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setPromotion(data[0].description);
        }
      })
      .catch(err => console.error("Error fetching promotions", err));

    // Get station reviews (for average rating)
    apiRequest("GET", `/api/stations/${station.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const total = data.reduce((sum: number, review: any) => sum + review.rating, 0);
          setRating(parseFloat((total / data.length).toFixed(1)));
        }
      })
      .catch(err => console.error("Error fetching reviews", err));
  }, [station.id, user]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;
    
    try {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${station.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { stationId: station.id });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite", error);
    }
  };

  return (
    <Card 
      className={cn(
        "bg-white border border-gray-200 rounded-xl p-0 shadow-sm hover:shadow-md transition-all cursor-pointer",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onClick(station)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{station.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{station.address}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "badge h-fit",
              station.status === "available" && "status-available",
              station.status === "busy" && "status-busy",
              station.status === "offline" && "status-offline"
            )}
          >
            {station.status === "available" ? "Disponível" : 
             station.status === "busy" ? "Ocupado" : "Offline"}
          </Badge>
        </div>
        
        <div className="mt-3 flex justify-between items-end">
          <div>
            <div className="flex items-center text-sm text-gray-600">
              <i className="fas fa-bolt mr-2 text-primary"></i>
              <span>
                {station.isFree 
                  ? "Gratuito" 
                  : `R$ ${station.pricePerKwh?.toFixed(2)}/kWh`}
                {" • "} 
                {station.connectorTypes.join("/")}
              </span>
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <i className="fas fa-clock mr-2 text-gray-400"></i>
              <span>{station.openingHours}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            {rating > 0 && (
              <div className="flex items-center mr-3">
                <i className="fas fa-star text-yellow-400 mr-1"></i>
                <span className="text-sm font-medium">{rating}</span>
              </div>
            )}
            
            <button 
              className={`${isFavorite ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
              onClick={toggleFavorite}
            >
              <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        
        {/* Promotion badge */}
        {promotion && (
          <div className="mt-3 bg-secondary-50 rounded-lg p-2 border border-secondary-100">
            <div className="flex items-start">
              <i className="fas fa-tag text-secondary-500 mt-0.5 mr-2"></i>
              <div>
                <p className="text-sm font-medium text-gray-900">{promotion}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
