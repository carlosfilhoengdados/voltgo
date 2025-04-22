import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Tag } from "lucide-react";
import { Station, Promotion } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Helper to get all promotions
const fetchAllPromotions = async () => {
  // First get all stations
  const stationsRes = await apiRequest("GET", "/api/stations");
  const stations = await stationsRes.json() as Station[];
  
  // Then get promotions for each station
  const promotionsPromises = stations.map(async (station) => {
    try {
      const promoRes = await apiRequest("GET", `/api/stations/${station.id}/promotions`);
      const promotions = await promoRes.json() as Promotion[];
      return promotions.map(promo => ({ ...promo, station }));
    } catch (error) {
      return [];
    }
  });
  
  const allPromotionsArray = await Promise.all(promotionsPromises);
  return allPromotionsArray.flat();
};

export default function PromotionsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "nearby">("all");
  
  const { data: promotions, isLoading } = useQuery({
    queryKey: ["/api/promotions"],
    queryFn: fetchAllPromotions
  });
  
  // Get user's location for "nearby" filter
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPromotions, setNearbyPromotions] = useState<(Promotion & { station: Station })[]>([]);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Mostrando todas as promoções.",
            variant: "destructive"
          });
          setFilter("all");
        }
      );
    }
  }, [toast]);
  
  // Calculate nearby promotions when we have promotions and user location
  useEffect(() => {
    if (!promotions || !userLocation) return;
    
    // Function to calculate distance between two points in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Filter promotions within 20km
    const nearby = promotions.filter(promo => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        promo.station.lat, 
        promo.station.lng
      );
      return distance <= 20; // 20km radius
    });
    
    setNearbyPromotions(nearby);
  }, [promotions, userLocation]);
  
  const displayedPromotions = filter === "all" ? promotions || [] : nearbyPromotions;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6 mb-16 md:mb-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Promoções em eletropostos</h1>
          <p className="text-gray-500 mt-1">
            Descubra promoções exclusivas e ganhe pontos VoltGo
          </p>
        </div>
        
        <div className="flex mb-6 space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todas promoções
          </Button>
          <Button
            variant={filter === "nearby" ? "default" : "outline"}
            onClick={() => setFilter("nearby")}
            disabled={!userLocation}
          >
            Próximas a mim
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayedPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPromotions.map(promo => (
              <Card key={promo.id} className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-secondary h-2" />
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <Tag className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{promo.station.name}</h3>
                      <p className="text-sm text-gray-500">{promo.station.address}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{promo.description}</p>
                    <div className="flex items-center mt-2">
                      <i className="fas fa-bolt text-primary-500 mr-2"></i>
                      <span className="text-sm text-gray-600">
                        Ganhe {promo.pointsValue} pontos VoltGo
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      <span>
                        Válido até {new Date(promo.endDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        // In real app, would navigate to station detail view
                        toast({
                          title: "Funcionalidade em breve",
                          description: "Em breve você poderá ver detalhes deste eletroposto."
                        });
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <i className="fas fa-tag text-gray-400"></i>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">Nenhuma promoção disponível</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {filter === "nearby" 
                ? "Não encontramos promoções próximas a você. Tente expandir sua busca."
                : "Não há promoções disponíveis no momento. Volte em breve para novas ofertas."}
            </p>
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
