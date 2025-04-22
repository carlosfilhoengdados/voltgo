import { useState, useEffect } from "react";
import { Station } from "@/types";
import StationCard from "./StationCard";
import { Button } from "@/components/ui/button";
import { List, MapPin } from "lucide-react";

interface StationListProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  selectedStation?: Station | null;
  onViewTypeChange?: (viewType: "list" | "map") => void;
}

export default function StationList({ 
  stations, 
  onStationSelect, 
  selectedStation,
  onViewTypeChange
}: StationListProps) {
  const [sortedStations, setSortedStations] = useState<Station[]>([]);
  const [listView, setListView] = useState(true);

  // Sort stations: available first, then by name
  useEffect(() => {
    const sorted = [...stations].sort((a, b) => {
      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;
      return a.name.localeCompare(b.name);
    });
    setSortedStations(sorted);
  }, [stations]);

  const toggleView = () => {
    setListView(!listView);
    if (onViewTypeChange) {
      onViewTypeChange(listView ? "map" : "list");
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Eletropostos próximos</h2>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-sm text-primary font-medium hover:text-primary-700"
          onClick={toggleView}
        >
          {listView ? (
            <>
              <MapPin className="mr-1 h-4 w-4" />
              Mapa
            </>
          ) : (
            <>
              <List className="mr-1 h-4 w-4" />
              Lista
            </>
          )}
        </Button>
      </div>
      
      {/* Station list with scroll */}
      <div className="mt-4 space-y-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-300px)]">
        {sortedStations.length > 0 ? (
          sortedStations.map(station => (
            <StationCard 
              key={station.id} 
              station={station} 
              onClick={onStationSelect}
              selected={selectedStation?.id === station.id}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma estação encontrada com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
}
