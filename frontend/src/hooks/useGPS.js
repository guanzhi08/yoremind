import { useEffect, useRef } from "react";
import client from "../api/client";

const UPLOAD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useGPS() {
  const lastUploadRef = useRef(0);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const upload = async (lat, lng) => {
      const now = Date.now();
      if (now - lastUploadRef.current < UPLOAD_INTERVAL_MS) return;
      lastUploadRef.current = now;
      try {
        await client.post("/location/update", { lat, lng });
      } catch {
        // silently ignore — offline or auth failure handled by interceptor
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => upload(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);
}
