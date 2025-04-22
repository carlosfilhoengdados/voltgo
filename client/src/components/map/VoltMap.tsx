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
    
    // Create map with Google Maps style options
    const map = L.map(mapContainerRef.current, {
      center: defaultLocation,
      zoom: 13,
      zoomControl: false, // We'll add custom zoom controls
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      doubleClickZoom: true,
      scrollWheelZoom: true
    });

    // Add Google Maps style tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
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
        html: `
          <div style="position: relative;">
            <!-- Google Maps blue dot with pulsing effect -->
            <div style="width: 16px; height: 16px; background-color: #4285F4; border-radius: 50%; position: relative; box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.3);">
              <!-- Inner white dot -->
              <div style="position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
            </div>
            <!-- Pulsing animation -->
            <div style="position: absolute; top: -8px; left: -8px; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(66, 133, 244, 0.15); opacity: 0.7; animation: pulse 2s infinite;"></div>
          </div>
          <style>
            @keyframes pulse {
              0% { transform: scale(0.5); opacity: 0.7; }
              50% { transform: scale(1); opacity: 0.3; }
              100% { transform: scale(0.5); opacity: 0.7; }
            }
          </style>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
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
    Object.entries(markersRef.current).forEach(([stationId, marker]) => {
      const station = stationsRef.current[parseInt(stationId)];
      if (station) {
        marker.setIcon(createStationIcon(station.status, false));
      }
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
