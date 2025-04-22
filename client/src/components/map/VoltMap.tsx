import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import { Station } from "@/types";
import { createStationIcon } from "@/lib/mapHelpers";

interface VoltMapProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
  selectedStation?: Station | null;
  className?: string;
}

export interface VoltMapRef {
  zoomIn: () => void;
  zoomOut: () => void;
  setView: (center: [number, number], zoom: number) => void;
}

const VoltMap = forwardRef<VoltMapRef, VoltMapProps>(({ stations, onStationClick, selectedStation, className = '' }, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const stationsRef = useRef<{ [key: number]: Station }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (mapRef.current) {
        mapRef.current.zoomIn();
      }
    },
    zoomOut: () => {
      if (mapRef.current) {
        mapRef.current.zoomOut();
      }
    },
    setView: (center: [number, number], zoom: number) => {
      if (mapRef.current) {
        mapRef.current.setView(center, zoom);
      }
    }
  }));

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default location (São Paulo)
    const defaultLocation: [number, number] = [-23.5505, -46.6333];
    
    // Create map
    const map = L.map(mapContainerRef.current, {
      center: defaultLocation,
      zoom: 13,
      zoomControl: false // We'll add custom zoom controls
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Try to get user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        map.setView([latitude, longitude], 14);
      },
      () => {
        // If error, use default location
        console.log("Could not get current location, using default");
      }
    );

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        userMarker.remove();
      }
    };
  }, [userLocation, mapRef.current]);

  // Add station markers
  useEffect(() => {
    if (!mapRef.current || !stations.length) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers and keep reference to stations
    stations.forEach(station => {
      const marker = L.marker([station.lat, station.lng], {
        icon: createStationIcon(station.status)
      }).addTo(mapRef.current!);

      marker.bindTooltip(station.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10]
      });

      marker.on('click', () => {
        onStationClick(station);
      });

      markersRef.current[station.id] = marker;
      stationsRef.current[station.id] = station;
    });
  }, [stations, mapRef.current]);

  // Center map on selected station
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Reset all markers to non-selected state first
    Object.values(markersRef.current).forEach(marker => {
      const station = marker.options.station as Station;
      marker.setIcon(createStationIcon(station.status, false));
    });
    
    if (!selectedStation) return;

    // Center the map on the selected station
    mapRef.current.setView([selectedStation.lat, selectedStation.lng], 15);
    
    // Highlight the selected marker
    if (markersRef.current[selectedStation.id]) {
      const marker = markersRef.current[selectedStation.id];
      marker.setIcon(createStationIcon(selectedStation.status, true));
    }
  }, [selectedStation]);

  return (
    <div className={`h-full w-full ${className}`}>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
});

export default VoltMap;
