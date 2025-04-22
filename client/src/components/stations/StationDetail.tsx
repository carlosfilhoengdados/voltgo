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
    <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{station.name}</h2>
          <p className="text-gray-600 mt-1">{station.address} - {station.city}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggleFavorite}
          >
            <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={shareStation}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={getDirections}
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-5">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Tipo de carregador</p>
          <div className="flex items-center">
            <i className="fas fa-plug text-primary mr-2"></i>
            <p className="font-medium">{station.connectorTypes.join("/")}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Preço</p>
          <div className="flex items-center">
            <i className="fas fa-dollar-sign text-primary mr-2"></i>
            <p className="font-medium">
              {station.isFree 
                ? "Gratuito" 
                : `R$ ${station.pricePerKwh?.toFixed(2)}/kWh`}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Potência</p>
          <div className="flex items-center">
            <i className="fas fa-bolt text-primary mr-2"></i>
            <p className="font-medium">
              {station.power} kW {station.power >= 50 ? "(Rápido)" : ""}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Detalhes</h3>
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-gray-600">
              <i className="fas fa-clock text-gray-400 mr-2 w-5"></i>
              <span>{station.openingHours}</span>
            </li>
            
            {station.hasFreeParking && (
              <li className="flex items-center text-sm text-gray-600">
                <i className="fas fa-car text-gray-400 mr-2 w-5"></i>
                <span>Estacionamento gratuito</span>
              </li>
            )}
            
            {station.hasWifi && (
              <li className="flex items-center text-sm text-gray-600">
                <i className="fas fa-wifi text-gray-400 mr-2 w-5"></i>
                <span>Wi-Fi gratuito</span>
              </li>
            )}
            
            {station.hasRestaurant && (
              <li className="flex items-center text-sm text-gray-600">
                <i className="fas fa-utensils text-gray-400 mr-2 w-5"></i>
                <span>Restaurante no local</span>
              </li>
            )}
            
            {station.hasWaitingArea && (
              <li className="flex items-center text-sm text-gray-600">
                <i className="fas fa-couch text-gray-400 mr-2 w-5"></i>
                <span>Área de espera</span>
              </li>
            )}
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Avaliações</h3>
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
      
      <div className="mt-5 border-t border-gray-200 pt-4 flex justify-between">
        <Button
          variant="ghost"
          className="text-primary"
          onClick={() => {
            // In a real app, you would navigate to a reviews page
            toast({
              title: "Funcionalidade em desenvolvimento",
              description: "Ver todas as avaliações estará disponível em breve"
            });
          }}
        >
          Ver todas as avaliações
        </Button>
        
        <Button
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white"
          onClick={startCharging}
          disabled={station.status !== "available"}
        >
          {station.status === "available" ? "Iniciar Recarga" : "Indisponível"}
        </Button>
      </div>
    </div>
  );
}
