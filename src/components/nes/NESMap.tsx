import { useEffect, useRef } from 'react';
import { GeoPoint, StateMetrics } from '@/types/nes';

interface NESMapProps {
  geoPoints: GeoPoint[];
  stateMetrics: StateMetrics[];
}

export function NESMap({ geoPoints }: NESMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || geoPoints.length === 0) return;

    let map: ReturnType<typeof import('leaflet')['map']> | null = null;

    import('leaflet').then(L => {
      if (!mapRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }

      map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const validPoints = geoPoints.filter(p => p.lat && p.lng);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [20, 20] });

        validPoints.forEach(point => {
          const radius = Math.max(5, Math.min(20, Math.sqrt(point.participants) * 0.5));
          L.circleMarker([point.lat, point.lng], {
            radius,
            fillColor: 'hsl(220, 70%, 40%)',
            color: '#fff',
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.7,
          })
            .bindPopup(`
              <div style="min-width:160px">
                <b>${point.name}</b><br>
                State: ${point.state}<br>
                Participants: ${point.participants.toLocaleString()}<br>
                Events: ${point.events.toLocaleString()}
              </div>
            `)
            .addTo(map!);
        });
      } else {
        map.setView([4.2105, 108.9758], 6);
      }
    });

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [geoPoints]);

  if (geoPoints.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No geographic data available
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full" />;
}
