import L from "leaflet";

/**
 * Creates a custom Leaflet icon for charging stations with different status
 * @param status - Station status (available, busy, offline)
 * @param isSelected - Whether the station is currently selected
 * @returns Leaflet DivIcon
 */
export function createStationIcon(status: string, isSelected: boolean = false): L.DivIcon {
  let bgColor = 'white';
  let iconColor = 'text-primary-600';
  let borderColor = 'border-gray-200';
  let scale = isSelected ? 'scale-125' : 'scale-100';
  
  if (status === 'available') {
    iconColor = 'text-green-600';
    borderColor = isSelected ? 'border-green-500' : 'border-gray-200';
  } else if (status === 'busy') {
    iconColor = 'text-yellow-600';
    borderColor = isSelected ? 'border-yellow-500' : 'border-gray-200';
  } else if (status === 'offline') {
    iconColor = 'text-red-600';
    borderColor = isSelected ? 'border-red-500' : 'border-gray-200';
  }
  
  const html = `
    <div class="w-8 h-8 bg-${bgColor} rounded-full flex items-center justify-center shadow-md border-2 ${borderColor} ${scale} transition-transform duration-200">
      <i class="fas fa-charging-station ${iconColor}"></i>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

/**
 * Calculates distance between two coordinates in kilometers
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
