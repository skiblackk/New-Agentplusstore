import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { cn } from "@/lib/utils";

type Coordinates = { lat: number; lng: number };

export interface MapMarker extends Coordinates {
  name?: string;
  address?: string;
  url?: string;
}

interface MapViewProps {
  className?: string;
  initialCenter?: Coordinates;
  initialZoom?: number;
  markers?: MapMarker[];
  onMapReady?: () => void;
}

function MapViewport({ center, zoom, markers }: { center: Coordinates; zoom: number; markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
    if (markers.length > 1) {
      map.fitBounds(markers.map((marker) => [marker.lat, marker.lng] as [number, number]), { padding: [28, 28] });
    }
  }, [center.lat, center.lng, map, markers, zoom]);

  return null;
}

export function MapView({
  className,
  initialCenter = { lat: -1.286389, lng: 36.817223 },
  initialZoom = 12,
  markers = [],
  onMapReady,
}: MapViewProps) {
  return (
    <MapContainer
      center={[initialCenter.lat, initialCenter.lng]}
      zoom={initialZoom}
      scrollWheelZoom
      className={cn("h-[500px] w-full", className)}
      whenReady={() => onMapReady?.()}
      aria-label="OpenStreetMap local market map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport center={initialCenter} zoom={initialZoom} markers={markers} />
      {markers.map((marker, index) => (
        <CircleMarker key={`${marker.lat}-${marker.lng}-${index}`} center={[marker.lat, marker.lng]} radius={8} pathOptions={{ color: "#ff7800", fillColor: "#ff7800", fillOpacity: 0.9 }}>
          <Popup>
            <strong>{marker.name || "Nearby business"}</strong>
            {marker.address && <div>{marker.address}</div>}
            {marker.url && <a href={marker.url} target="_blank" rel="noreferrer">View on OpenStreetMap</a>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
