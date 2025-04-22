import { useEffect, useState, useRef } from "react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import VoltMap from "@/components/map/VoltMap";
import MapControls from "@/components/map/MapControls";
import FilterTags from "@/components/stations/FilterTags";
import StationList from "@/components/stations/StationList";
import StationDetail from "@/components/stations/StationDetail";
import { Station } from "@/types";
import { useStations } from "@/hooks/use-stations";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function MapPage() {
  const { user } = useAuth();
  const mapRef = useRef<any>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: ["available"],
    connectorTypes: [],
    isFree: null as boolean | null,
    minPower: 0,
  });

  const { stations, isLoading, error } = useStations(filters);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setShowDetailOnMobile(true);
  };

  const handleCloseDetail = () => {
    setSelectedStation(null);
    setShowDetailOnMobile(false);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Aqui você pode implementar a lógica de busca por eletropostos ou endereços
    console.log("Searching for:", query);
    
    // Exemplo: buscar por nome da estação
    if (query && stations) {
      // Buscar estação pelo nome
      const foundStation = stations.find(station => 
        station.name.toLowerCase().includes(query.toLowerCase()) ||
        station.address.toLowerCase().includes(query.toLowerCase())
      );
      
      if (foundStation) {
        setSelectedStation(foundStation);
        
        // Centralizar o mapa na estação encontrada
        if (mapRef.current) {
          mapRef.current.setView([foundStation.lat, foundStation.lng], 15);
        }
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mapRef.current) {
            mapRef.current.setView(
              [position.coords.latitude, position.coords.longitude],
              14
            );
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onSearch={handleSearch} />
      
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar for filters and station list */}
        <aside className={`w-full md:w-96 bg-white md:border-r border-gray-200 md:h-full flex flex-col ${viewMode === "map" && "hidden md:flex"}`}>
          <div className="p-4 flex-1 overflow-auto">
            <FilterTags 
              filters={filters} 
              onFilterChange={handleFilterChange}
            />
            
            <StationList 
              stations={stations || []}
              onStationSelect={handleStationSelect}
              selectedStation={selectedStation}
              onViewTypeChange={(type) => setViewMode(type)}
            />
          </div>
          
          {/* Add station button */}
          <div className="p-4 border-t border-gray-200">
            <Link href="/register-station">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar meu eletroposto
              </Button>
            </Link>
          </div>
        </aside>

        {/* Map Section */}
        <section className={`flex-1 relative ${viewMode === "list" && "hidden md:block"}`}>
          <div className="absolute inset-0 p-4">
            {/* Map Container */}
            <VoltMap 
              stations={stations || []}
              onStationClick={handleStationSelect}
              selectedStation={selectedStation}
              ref={mapRef}
            />
            
            {/* Map Controls */}
            <MapControls 
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onLocateMe={handleLocateMe}
            />
            
            {/* Google Maps style name label */}
            {selectedStation && (
              <>
                {/* Station name label (Google Maps style) */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg text-gray-800 font-medium text-sm flex items-center">
                    <span>{selectedStation.name}</span>
                  </div>
                </div>
                
                {/* Station Detail Overlay */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
                  <StationDetail 
                    station={selectedStation}
                    onClose={handleCloseDetail}
                  />
                </div>
              </>
            )}
          </div>
        </section>
        
        {/* Mobile Station Detail (full screen) */}
        {showDetailOnMobile && selectedStation && (
          <div className="fixed inset-0 z-50 md:hidden bg-white p-4 overflow-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4"
              onClick={handleCloseDetail}
            >
              &larr; Voltar
            </Button>
            <StationDetail 
              station={selectedStation}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}
