import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/client";

// Vite bundles break Leaflet's default icon URL resolution
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [25.0478, 121.5319];
const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CIRCLE_STYLE = { color: "#3B82F6", fillColor: "#BFDBFE", fillOpacity: 0.3, weight: 2 };
const DEFAULT_RADIUS = 200;

export default function Map8Picker({ lat, lng, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const positionRef = useRef(lat && lng ? { lat, lng } : null);
  // Use a ref so the map click handler always sees the latest radius
  const radiusRef = useRef(DEFAULT_RADIUS);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = lat && lng ? [lat, lng] : DEFAULT_CENTER;
    mapInstanceRef.current = L.map(mapRef.current).setView(center, 15);

    L.tileLayer(OSM_TILE, { attribution: OSM_ATTRIBUTION, maxZoom: 19 })
      .addTo(mapInstanceRef.current);

    mapInstanceRef.current.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      placePin(clickLat, clickLng);
    });

    if (lat && lng) {
      drawMarkerAndCircle(lat, lng, radiusRef.current);
    }

    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 0);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const drawMarkerAndCircle = (lat, lng, r) => {
    if (!mapInstanceRef.current) return;
    markerRef.current?.remove();
    circleRef.current?.remove();
    markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
    circleRef.current = L.circle([lat, lng], { radius: r, ...CIRCLE_STYLE })
      .addTo(mapInstanceRef.current);
    mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    positionRef.current = { lat, lng };
  };

  const placePin = (lat, lng) => {
    drawMarkerAndCircle(lat, lng, radiusRef.current);
    onSelect({ lat, lng, radius: radiusRef.current });
  };

  const handleRadiusChange = (e) => {
    const r = Math.min(2000, Math.max(50, Number(e.target.value)));
    radiusRef.current = r;
    setRadius(r);
    if (positionRef.current && mapInstanceRef.current) {
      const { lat, lng } = positionRef.current;
      circleRef.current?.remove();
      circleRef.current = L.circle([lat, lng], { radius: r, ...CIRCLE_STYLE })
        .addTo(mapInstanceRef.current);
      mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
      onSelect({ lat, lng, radius: r });
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const { data } = await client.get("/nominatim/search", { params: { q: search, limit: 5 } });
      setResults(data);
    } catch {
      setResults([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const selectResult = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    placePin(lat, lng);
    setResults([]);
    setSearch(place.display_name.split(",")[0]);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜尋地標（OpenStreetMap）…"
        />
        <button style={styles.searchBtn} type="button" onClick={handleSearch}>搜尋</button>
      </div>

      {results.length > 0 && (
        <ul style={styles.resultList}>
          {results.map((r) => (
            <li key={r.place_id} style={styles.resultItem} onClick={() => selectResult(r)}>
              <strong>{r.display_name.split(",")[0]}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}>
                {" "}{r.display_name.split(",").slice(1, 3).join(",")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div ref={mapRef} style={styles.map} />

      <div style={styles.radiusRow}>
        <label style={styles.radiusLabel}>觸發半徑</label>
        <input
          style={styles.radiusInput}
          type="range"
          min={50}
          max={2000}
          step={50}
          value={radius}
          onChange={handleRadiusChange}
        />
        <span style={styles.radiusValue}>{radius} 公尺</span>
      </div>

      <p style={styles.hint}>點擊地圖選取位置 · OpenStreetMap · 無需 API Key</p>
    </div>
  );
}

const styles = {
  wrapper: { borderRadius: 12, overflow: "hidden", border: "1.5px solid #e2e8f0", background: "#fff" },
  searchRow: { display: "flex", gap: 8, padding: 8, borderBottom: "1px solid #f1f5f9" },
  searchInput: { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14 },
  searchBtn: { padding: "8px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 14 },
  resultList: { listStyle: "none", margin: 0, padding: "4px 0", maxHeight: 160, overflowY: "auto", borderBottom: "1px solid #f1f5f9" },
  resultItem: { padding: "8px 12px", cursor: "pointer", fontSize: 14, lineHeight: 1.4 },
  map: { height: 280, width: "100%" },
  radiusRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderTop: "1px solid #f1f5f9" },
  radiusLabel: { fontSize: 13, color: "#374151", whiteSpace: "nowrap" },
  radiusInput: { flex: 1, accentColor: "#3B82F6" },
  radiusValue: { fontSize: 13, color: "#3B82F6", fontWeight: 600, minWidth: 60, textAlign: "right" },
  hint: { textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "4px 0 8px", margin: 0 },
};
