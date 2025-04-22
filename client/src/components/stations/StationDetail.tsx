import { useEffect, useState } from "react";
import { Station } from "@/types";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Navigation } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface StationDetailProps {
  station: Station;
  onClose: () => void;
}

export default function StationDetail({ station, onClose }: StationDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    // Check if station is favorite
    if (user) {
      apiRequest("GET", `/api/favorites/check/${station.id}`)
        .then(res => res.json())
        .then(data => setIsFavorite(data.isFavorite))
        .catch(err => console.error("Error checking favorite status", err));
    }

    // Get station reviews
    apiRequest("GET", `/api/stations/${station.id}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        if (data.length > 0) {
          const total = data.reduce((sum: number, review: Review) => sum + review.rating, 0);
          setAverageRating(parseFloat((total / data.length).toFixed(1)));
        }
      })
      .catch(err => console.error("Error fetching reviews", err));
  }, [station.id, user]);

  const toggleFavorite = async () => {
    if (!user) return;
    
    try {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${station.id}`);
        toast({
          title: "Removido dos favoritos",
          description: "Estação removida dos seus favoritos com sucesso"
        });
      } else {
        await apiRequest("POST", "/api/favorites", { stationId: station.id });
        toast({
          title: "Adicionado aos favoritos",
          description: "Estação adicionada aos seus favoritos com sucesso"
        });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar favoritos",
        variant: "destructive"
      });
    }
  };

  const startCharging = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest("POST", "/api/charging/start", { stationId: station.id });
      const session = await response.json();
      
      toast({
        title: "Recarga iniciada!",
        description: "Sua sessão de recarga foi iniciada com sucesso"
      });
      
      // In a real app, you would navigate to a charging progress screen here
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a recarga",
        variant: "destructive"
      });
    }
  };

  const getDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`);
  };

  const shareStation = () => {
    if (navigator.share) {
      navigator.share({
        title: `VoltGo - ${station.name}`,
        text: `Confira este ponto de recarga para veículos elétricos: ${station.name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência"
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-xl border-0">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
              station.status === 'available' ? 'bg-green-500' : 
              station.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <h2 className="text-xl font-semibold text-gray-900">{station.name}</h2>
          </div>
          <p className="text-gray-600 mt-1 text-sm">{station.address} - {station.city}</p>
          
          {/* Google Maps style status pill */}
          <div className="mt-2 inline-block">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              station.status === 'available' ? 'bg-green-100 text-green-800' : 
              station.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {station.status === 'available' ? 'Disponível' : 
               station.status === 'busy' ? 'Em uso' : 'Fora de serviço'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 hover:bg-gray-100"
            onClick={toggleFavorite}
          >
            <Heart className="h-5 w-5" fill={isFavorite ? "#EA4335" : "none"} stroke={isFavorite ? "#EA4335" : "currentColor"} />
          </Button>
          
          <Button
            variant="ghost" 
            size="icon"
            className="rounded-full h-9 w-9 hover:bg-gray-100"
            onClick={shareStation}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 hover:bg-gray-100"
            onClick={getDirections}
          >
            <Navigation className="h-5 w-5 text-blue-500" />
          </Button>
        </div>
      </div>
      
      {/* Google Maps style info chips */}
      <div className="flex flex-wrap gap-2 mt-4">
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
          <i className="fas fa-plug text-gray-700 mr-2"></i>
          <span>{station.connectorTypes.join("/")}</span>
        </div>
        
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
          <i className="fas fa-bolt text-gray-700 mr-2"></i>
          <span>{station.power} kW {station.power >= 50 ? "(Rápido)" : ""}</span>
        </div>
        
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
          <i className={`fas fa-${station.isFree ? 'check-circle text-green-500' : 'dollar-sign text-gray-700'} mr-2`}></i>
          <span>{station.isFree ? "Gratuito" : `R$ ${station.pricePerKwh?.toFixed(2)}/kWh`}</span>
        </div>
      </div>
      
      {/* Google Maps style details */}
      <div className="mt-5 flex flex-col space-y-4">
        <div>
          <div className="flex items-center text-sm mb-2">
            <i className="fas fa-clock text-gray-500 mr-2"></i>
            <span className="font-medium text-gray-800">{station.openingHours}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {station.hasFreeParking && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                <i className="fas fa-car mr-1"></i>
                <span>Estacionamento gratuito</span>
              </div>
            )}
            
            {station.hasWifi && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                <i className="fas fa-wifi mr-1"></i>
                <span>Wi-Fi</span>
              </div>
            )}
            
            {station.hasRestaurant && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                <i className="fas fa-utensils mr-1"></i>
                <span>Restaurante</span>
              </div>
            )}
            
            {station.hasWaitingArea && (
              <div className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-800">
                <i className="fas fa-couch mr-1"></i>
                <span>Área de espera</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Google Maps style reviews section */}
        <div className="bg-gray-50 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900">Avaliações</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-blue-600 hover:bg-blue-50 p-0"
              onClick={() => {
                toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "Ver todas as avaliações estará disponível em breve"
                });
              }}
            >
              Ver todas
            </Button>
          </div>
          
          {reviews.length > 0 ? (
            <>
              <div className="flex items-center mb-2">
                <div className="flex mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star}
                      className={`fas fa-star ${star <= Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    ></i>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{averageRating} ({reviews.length} avaliações)</span>
              </div>
              
              {reviews[0]?.comment && (
                <p className="text-sm text-gray-600 italic">"{reviews[0].comment}"</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">Ainda não há avaliações para esta estação.</p>
          )}
        </div>
      </div>
      
      {/* Google Maps style action button */}
      <div className="mt-5 pt-2 flex justify-center">
        <Button
          className={`w-full py-2 font-medium rounded-full ${
            station.status === 'available' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-200 text-gray-600 cursor-not-allowed'
          }`}
          onClick={startCharging}
          disabled={station.status !== "available"}
        >
          {station.status === "available" ? "Iniciar Recarga" : "Indisponível"}
        </Button>
      </div>
    </div>
  );
}
