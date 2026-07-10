"use client";

import { useEffect, useRef } from "react";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLon { lat: number; lon: number; }

interface SatelliteMapProps {
  resetKey: number;
  locked: boolean;
  guess: LatLon | null;
  actual: (LatLon & { label: string }) | null;
  onPick: (lat: number, lon: number) => void;
}

const OK_BOUNDS: [[number, number], [number, number]] = [[32.6, -104.6], [37.7, -93.3]];
const OK_CENTER: [number, number] = [35.55, -98.35];

export default function SatelliteMap({ resetKey, locked, guess, actual, onPick }: SatelliteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const guessLayerRef = useRef<LType.CircleMarker | null>(null);
  const actualLayerRef = useRef<LType.CircleMarker | null>(null);
  const lineLayerRef = useRef<LType.Polyline | null>(null);
  const lockedRef = useRef(locked);
  const onPickRef = useRef(onPick);
  lockedRef.current = locked;
  onPickRef.current = onPick;

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: OK_CENTER,
        zoom: 6,
        minZoom: 6,
        maxZoom: 12,
        maxBounds: OK_BOUNDS,
        maxBoundsViscosity: 0.9,
        attributionControl: true,
      });
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
      }).addTo(map);
      map.fitBounds([[33.55, -103.1], [37.15, -94.35]]);
      map.on("click", (e: LType.LeafletMouseEvent) => {
        if (lockedRef.current) return;
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset view + clear layers on new question
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    guessLayerRef.current?.remove(); guessLayerRef.current = null;
    actualLayerRef.current?.remove(); actualLayerRef.current = null;
    lineLayerRef.current?.remove(); lineLayerRef.current = null;
    map.fitBounds([[33.55, -103.1], [37.15, -94.35]]);
  }, [resetKey]);

  // Draw guess marker
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      guessLayerRef.current?.remove(); guessLayerRef.current = null;
      if (guess) {
        guessLayerRef.current = L.circleMarker([guess.lat, guess.lon], {
          radius: 9, color: "#fff", weight: 2.5, fillColor: "#b5451f", fillOpacity: 1,
        }).addTo(map);
      }
    })();
  }, [guess]);

  // Draw actual marker + connecting line, zoom to fit both
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      actualLayerRef.current?.remove(); actualLayerRef.current = null;
      lineLayerRef.current?.remove(); lineLayerRef.current = null;
      if (actual) {
        actualLayerRef.current = L.circleMarker([actual.lat, actual.lon], {
          radius: 9, color: "#fff", weight: 2.5, fillColor: "#1a7a3a", fillOpacity: 1,
        }).addTo(map).bindTooltip(actual.label, { permanent: true, direction: "top", offset: [0, -10] });
        if (guess) {
          lineLayerRef.current = L.polyline([[guess.lat, guess.lon], [actual.lat, actual.lon]], {
            color: "#3a2a18", weight: 2, dashArray: "5,5",
          }).addTo(map);
          map.fitBounds(L.latLngBounds([guess.lat, guess.lon], [actual.lat, actual.lon]), { padding: [40, 40], maxZoom: 9 });
        } else {
          map.setView([actual.lat, actual.lon], 8);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
