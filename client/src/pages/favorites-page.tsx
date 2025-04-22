import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Loader2 } from "lucide-react";
import StationCard from "@/components/stations/StationCard";
import StationDetail from "@/components/stations/StationDetail";
import { Station } from "@/types";

export default function FavoritesPage() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favorites");
      return res.json() as Promise<Station[]>;
    },
  });

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setSelectedStation(null);
    setShowDetail(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6 mb-16 md:mb-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Seus eletropostos favoritos</h1>
          <p className="text-gray-500 mt-1">
            Acesse rapidamente seus eletropostos salvos
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(station => (
              <StationCard
                key={station.id}
                station={station}
                onClick={handleStationSelect}
                selected={selectedStation?.id === station.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <i className="fas fa-heart text-gray-400"></i>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">Nenhum favorito ainda</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Você ainda não adicionou nenhum eletroposto aos seus favoritos. Explore o mapa e salve seus eletropostos preferidos.
            </p>
          </div>
        )}
      </main>
      
      {/* Mobile Station Detail (full screen) */}
      {showDetail && selectedStation && (
        <div className="fixed inset-0 z-50 bg-white p-4 overflow-auto">
          <button 
            className="flex items-center text-gray-600 mb-4"
            onClick={handleCloseDetail}
          >
            &larr; <span className="ml-1">Voltar</span>
          </button>
          <StationDetail 
            station={selectedStation}
            onClose={handleCloseDetail}
          />
        </div>
      )}
      
      <MobileNav />
    </div>
  );
}
