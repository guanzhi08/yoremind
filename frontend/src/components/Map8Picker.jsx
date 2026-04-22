import { useEffect, useRef, useState } from "react";

const MAP8_SDK_URL = "https://api.map8.zone/maps/v1/js";
const DEFAULT_CENTER = [25.0478, 121.5319]; // Taipei

let sdkLoaded = false;
let sdkLoadPromise = null;

function loadMap8SDK(apiKey) {
  if (sdkLoaded) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAP8_SDK_URL}?key=${apiKey}`;
    script.onload = () => { sdkLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

export default function Map8Picker({ lat, lng, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [apiKey] = useState(() => import.meta.env.VITE_MAP8_API_KEY || "");

  useEffect(() => {
    if (!apiKey) return;

    loadMap8SDK(apiKey).then(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const M = window.maplibregl || window.Map8;
      if (!M) return;

      const center = lat && lng ? [lng, lat] : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]];
      mapInstanceRef.current = new M.Map({
        container: mapRef.current,
        style: `https://api.map8.zone/style/osm-style.json?key=${apiKey}`,
        center,
        zoom: 15,
      });

      mapInstanceRef.current.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.lngLat;
        placeMarker(clickLng, clickLat);
        onSelect(clickLat, clickLng);
      });

      if (lat && lng) placeMarker(lng, lat);
    }).catch(() => {
      // SDK load failed — map will be unavailable
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey]);

  const placeMarker = (lng, lat) => {
    const M = window.maplibregl || window.Map8;
    if (!M || !mapInstanceRef.current) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = new M.Marker({ color: "#6366f1" })
      .setLngLat([lng, lat])
      .addTo(mapInstanceRef.current);
    mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim() || !apiKey) return;
    try {
      const res = await fetch(
        `https://api.map8.zone/place/textsearch/json?query=${encodeURIComponent(search)}&key=${apiKey}&language=zh-TW`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
  };

  const selectResult = (place) => {
    const { lat: rLat, lng: rLng } = place.geometry.location;
    placeMarker(rLng, rLat);
    onSelect(rLat, rLng);
    setResults([]);
    setSearch(place.name);
  };

  if (!apiKey) {
    return (
      <div style={styles.placeholder}>
        <p style={styles.noKey}>未設定 VITE_MAP8_API_KEY</p>
        <p style={styles.noKeyHint}>請在 .env 中設定地圖 API Key</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSearch} style={styles.searchRow}>
        <input style={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋地標…" />
        <button style={styles.searchBtn} type="submit">搜尋</button>
      </form>
      {results.length > 0 && (
        <ul style={styles.resultList}>
          {results.slice(0, 5).map((r) => (
            <li key={r.place_id} style={styles.resultItem} onClick={() => selectResult(r)}>
              <strong>{r.name}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}> {r.formatted_address}</span>
            </li>
          ))}
        </ul>
      )}
      <div ref={mapRef} style={styles.map} />
      <p style={styles.hint}>點擊地圖選取位置</p>
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
  map: { height: 220, width: "100%" },
  hint: { textAlign: "center", color: "#94a3b8", fontSize: 12, padding: 6 },
  placeholder: { background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1", padding: 24, textAlign: "center" },
  noKey: { color: "#64748b", fontWeight: 600 },
  noKeyHint: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
};
