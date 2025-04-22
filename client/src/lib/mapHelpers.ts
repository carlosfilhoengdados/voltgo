import L from "leaflet";

/**
 * Creates a custom Leaflet icon for charging stations with different status
 * @param status - Station status (available, busy, offline)
 * @param isSelected - Whether the station is currently selected
 * @returns Leaflet DivIcon
 */
export function createStationIcon(status: string, isSelected: boolean = false): L.DivIcon {
  let mainColor = '#4285F4'; // Google Maps blue
  let zIndex = isSelected ? '999' : '1';
  
  if (status === 'available') {
    mainColor = '#34A853'; // Google Maps green
  } else if (status === 'busy') {
    mainColor = '#FBBC05'; // Google Maps yellow
  } else if (status === 'offline') {
    mainColor = '#EA4335'; // Google Maps red
  }
  
  // Create a Google Maps style marker pin
  const html = `
    <div style="position: relative; z-index: ${zIndex}; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transform-origin: bottom center; transition: transform 0.2s;">
      <div style="width: 24px; height: 36px; background-color: ${mainColor}; border-radius: 12px 12px 0 12px; position: relative; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        <div style="position: absolute; top: 8px; left: 5px; width: 14px; height: 14px; background-color: white; border-radius: 7px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-bolt" style="color: ${mainColor}; font-size: 8px;"></i>
        </div>
        <div style="position: absolute; bottom: -8px; left: 12px; transform: rotate(45deg); width: 16px; height: 16px; background-color: ${mainColor};"></div>
      </div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36]
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
