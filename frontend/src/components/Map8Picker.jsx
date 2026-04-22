import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = [25.0478, 121.5319]; // Taipei
const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

let leafletLoaded = false;
let leafletLoadPromise = null;

function loadLeaflet() {
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    // CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => { leafletLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return leafletLoadPromise;
}

export default function Map8Picker({ lat, lng, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadLeaflet().then(() => setReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const center = lat && lng ? [lat, lng] : DEFAULT_CENTER;

    mapInstanceRef.current = L.map(mapRef.current).setView(center, 15);

    L.tileLayer(OSM_TILE, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      placeMarker(clickLat, clickLng);
      onSelect(clickLat, clickLng);
    });

    if (lat && lng) placeMarker(lat, lng);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ready]);

  const placeMarker = (lat, lng) => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
    mapInstanceRef.current.setView([lat, lng], 16);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `${NOMINATIM_SEARCH}?q=${encodeURIComponent(search)}&format=json&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "zh-TW,zh;q=0.9" } }
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    }
  };

  const selectResult = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    placeMarker(lat, lng);
    onSelect(lat, lng);
    setResults([]);
    setSearch(place.display_name.split(",")[0]);
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSearch} style={styles.searchRow}>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋地標（OpenStreetMap）…"
        />
        <button style={styles.searchBtn} type="submit">搜尋</button>
      </form>

      {results.length > 0 && (
        <ul style={styles.resultList}>
          {results.map((r) => (
            <li key={r.place_id} style={styles.resultItem} onClick={() => selectResult(r)}>
              <strong>{r.display_name.split(",")[0]}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}> {r.display_name.split(",").slice(1, 3).join(",")}</span>
            </li>
          ))}
        </ul>
      )}

      {!ready && <div style={styles.loading}>地圖載入中…</div>}
      <div ref={mapRef} style={{ ...styles.map, display: ready ? "block" : "none" }} />
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
  loading: { height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" },
  map: { height: 220, width: "100%" },
  hint: { textAlign: "center", color: "#94a3b8", fontSize: 12, padding: 6 },
};
