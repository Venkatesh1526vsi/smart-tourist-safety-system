import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  coordinates: { lat: number; lng: number } | null;
  locationName: string;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  timestamp: number | null;
  isMoving: boolean;
}

export function useGeolocation(autoFetch = false) {
  const [data, setData] = useState<LocationData>({
    coordinates: null,
    locationName: '',
    loading: false,
    error: null,
    accuracy: null,
    timestamp: null,
    isMoving: false,
  });

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setData(prev => ({ ...prev, error: 'Geolocation not supported by your browser', loading: false }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let resolvedLocation = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

        try {
          // Add a short timeout to prevent fetch hanging forever
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const geocodeData = await response.json();
            const area = geocodeData.address?.suburb || geocodeData.address?.neighbourhood || geocodeData.address?.city_district || '';
            const city = geocodeData.address?.city || geocodeData.address?.town || geocodeData.address?.village || geocodeData.address?.county || '';
            const state = geocodeData.address?.state || '';
            
            const components = [area, city, state].filter(Boolean);
            if (components.length > 0) {
              resolvedLocation = components.join(', ');
            }
          }
        } catch (err) {
          console.error('[useGeolocation] Reverse geocoding failed:', err);
        }

        setData({
          coordinates: { lat: latitude, lng: longitude },
          locationName: resolvedLocation,
          loading: false,
          error: null,
          accuracy,
          timestamp: position.timestamp,
          isMoving: false, // Could be determined by watching position, but keeping it simple for now
        });
      },
      (error) => {
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Unable to fetch location: ${error.message}` 
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation]);

  return { ...data, fetchLocation };
}
