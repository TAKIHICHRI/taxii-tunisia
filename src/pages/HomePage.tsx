import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Star, ChevronDown, Car, Zap, Crown, X, Calendar, Shield, Phone, MessageCircle, Locate, Tag, Share2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../store';
import type { Ride } from '../types';
import RatingModal from '../components/RatingModal';

// Kasserine center coordinates
const KASSERINE_CENTER: [number, number] = [35.1676, 8.8365];

// Brand colors
const BRAND_PRIMARY = '#F5B800';
const BRAND_ORANGE = '#FF8A00';

// Custom marker icons (Leaflet)
const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:${BRAND_PRIMARY};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;background:white;border-radius:50%"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:${BRAND_ORANGE};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:10px;height:10px;background:white;border-radius:50%"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = L.divIcon({
  className: 'custom-marker driver-marker-wrapper',
  html: `<div class="driver-marker-car" style="width:40px;height:40px;border-radius:12px;background:${BRAND_PRIMARY};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px">🚕</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const userIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 4px rgba(245,184,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const ghostIcon = L.divIcon({
  className: 'ghost-car',
  html: `<div style="width:28px;height:28px;border-radius:10px;background:${BRAND_ORANGE};border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:16px;opacity:.75">🚗</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Map click handler component
const MapClickHandler: React.FC<{
  mode: 'pickup' | 'destination';
  onPickup: (lat: number, lng: number) => void;
  onDestination: (lat: number, lng: number) => void;
}> = ({ mode, onPickup, onDestination }) => {
  useMapEvents({
    click(e) {
      if (mode === 'pickup') {
        onPickup(e.latlng.lat, e.latlng.lng);
      } else {
        onDestination(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Fly to location component
const FlyToLocation: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
};

const rideTypes = [
  { id: 'economy' as const, nameKey: 'economy', descKey: 'economyDesc', Icon: Car, basePrice: 2.5, time: 5, emoji: '🚕' },
  { id: 'comfort' as const, nameKey: 'comfort', descKey: 'comfortDesc', Icon: Zap, basePrice: 4.0, time: 3, emoji: '🚙' },
  { id: 'premium' as const, nameKey: 'premium', descKey: 'premiumDesc', Icon: Crown, basePrice: 7.0, time: 2, emoji: '🏎️' },
];

const recentPlaces = [
  { name: 'حي النور', address: 'القصرين، حي النور', emoji: '🏠', lat: 35.1720, lng: 8.8400 },
  { name: 'المحطة', address: 'محطة القطار - القصرين', emoji: '🚉', lat: 35.1650, lng: 8.8300 },
  { name: 'سوق المركزي', address: 'وسط المدينة', emoji: '🛍️', lat: 35.1680, lng: 8.8380 },
  { name: 'المستشفى الجهوي', address: 'شارع الحبيب بورقيبة', emoji: '🏥', lat: 35.1700, lng: 8.8420 },
];

// Calculate distance between two points
const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    selectedRideType,
    setSelectedRideType,
    offers,
    addToast,
    addNotification,
    addRideToHistory,
    setRideRating,
    favoriteHome,
    favoriteWork,
    setFavoritePlace,
  } = useAppStore();
  const [showBooking, setShowBooking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [driverFound, setDriverFound] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rideToRate, setRideToRate] = useState<{ id: string; driverName: string } | null>(null);

  // Map state
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [pickupPos, setPickupPos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [pickupLabel, setPickupLabel] = useState('');
  const [destLabel, setDestLabel] = useState('');
  const [mapMode, setMapMode] = useState<'pickup' | 'destination'>('pickup');
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number]>(KASSERINE_CENTER);
  const [mapReady, setMapReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'd17'>('cash');
  const [d17Phone, setD17Phone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ discount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const driverApproachToastShown = useRef(false);
  const defaultProvider: 'carto' | 'osm' = 'osm';
  const tileSwitchEnabled = false;
  const [tileProvider, setTileProvider] = useState<'carto' | 'osm'>(defaultProvider);
  const tileSwitchedRef = useRef(false);
  const tileErrorCountRef = useRef(0);
  const tileErrorWindowRef = useRef<number>(0);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [osrmDistanceKm, setOsrmDistanceKm] = useState<number | null>(null);
  const [osrmDurationMin, setOsrmDurationMin] = useState<number | null>(null);
  const [ghostCars, setGhostCars] = useState<Array<{ id: string; path: [number, number][], idx: number; speed: number }>>([]);
  const ghostAnimRef = useRef<number | null>(null);
  const [mapMaxZoom, setMapMaxZoom] = useState(16);
  const [tileKeepBuffer, setTileKeepBuffer] = useState(5);
  const [dataSaverActive, setDataSaverActive] = useState(false);
  const [isPeak, setIsPeak] = useState(false);
  const peakNotifiedRef = useRef(false);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPosition(loc);
          setPickupPos(loc);
          setFlyTo(loc);
        },
        () => {
          // Default to Kasserine center
          setPickupPos(KASSERINE_CENTER);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // تتبع السائق: حركة سلسة من نقطة البداية → نقطة الالتقاط → الوجهة على المسار
  useEffect(() => {
    if (!driverFound || !pickupPos || !destPos) return;
    const driverStart: [number, number] = [pickupPos[0] + 0.008, pickupPos[1] - 0.006];
    const midLat = (pickupPos[0] + destPos[0]) / 2 + 0.002;
    const midLng = (pickupPos[1] + destPos[1]) / 2 - 0.001;
    const routePoints: [number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const lat = (1 - t) ** 2 * pickupPos[0] + 2 * (1 - t) * t * midLat + t ** 2 * destPos[0];
      const lng = (1 - t) ** 2 * pickupPos[1] + 2 * (1 - t) * t * midLng + t ** 2 * destPos[1];
      routePoints.push([lat, lng]);
    }
    setDriverPos(driverStart);
    driverApproachToastShown.current = false;
    const totalSteps = 80;
    const stepMs = 200;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      let lat: number, lng: number;
      if (progress <= 0.35) {
        const p = progress / 0.35;
        lat = driverStart[0] + (pickupPos[0] - driverStart[0]) * p;
        lng = driverStart[1] + (pickupPos[1] - driverStart[1]) * p;
        if (p >= 0.9 && !driverApproachToastShown.current) {
          driverApproachToastShown.current = true;
          addToast(t('driverApproaching'), 'info');
        }
      } else {
        const p = (progress - 0.35) / 0.65;
        const idx = Math.min(Math.floor(p * (routePoints.length - 1)), routePoints.length - 1);
        [lat, lng] = routePoints[idx];
      }
      setDriverPos([lat, lng]);
      if (progress >= 1) clearInterval(interval);
    }, stepMs);
    return () => clearInterval(interval);
  }, [driverFound, pickupPos, destPos, addToast, t]);

  const handlePickup = useCallback(async (lat: number, lng: number) => {
    setPickupPos([lat, lng]);
    setMapMode('destination');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ar&lat=${lat}&lon=${lng}`);
      const j = await res.json();
      const txt = j.display_name || '';
      setPickupLabel(txt);
    } catch {
      setPickupLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  const handleDestination = useCallback(async (lat: number, lng: number) => {
    setDestPos([lat, lng]);
    setShowBooking(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ar&lat=${lat}&lon=${lng}`);
      const j = await res.json();
      const txt = j.display_name || '';
      setDestLabel(txt);
    } catch {
      setDestLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const makeCircle = (center: [number, number], radiusDeg: number, points: number, phase: number): [number, number][] => {
      const res: [number, number][] = [];
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2 + phase;
        const lat = center[0] + Math.sin(a) * radiusDeg;
        const lng = center[1] + Math.cos(a) * radiusDeg;
        res.push([lat, lng]);
      }
      return res;
    };
    const cars = Array.from({ length: 6 }).map((_, i) => {
      const r = 0.01 + (i % 3) * 0.004;
      const p = makeCircle(KASSERINE_CENTER, r, 180, i * 0.6);
      return { id: `g${i}`, path: p, idx: Math.floor(Math.random() * p.length), speed: 1 + (i % 2) };
    });
    setGhostCars(cars);
    if (ghostAnimRef.current) cancelAnimationFrame(ghostAnimRef.current);
    let last = performance.now();
    const step = (time: number) => {
      const dt = time - last;
      if (dt > 450) {
        setGhostCars((prev) =>
          prev.map((c) => ({
            ...c,
            idx: (c.idx + c.speed) % c.path.length,
          })),
        );
        last = time;
      }
      ghostAnimRef.current = requestAnimationFrame(step);
    };
    ghostAnimRef.current = requestAnimationFrame(step);
    return () => {
      if (ghostAnimRef.current) cancelAnimationFrame(ghostAnimRef.current);
      ghostAnimRef.current = null;
    };
  }, [mapReady]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPosition(loc);
          setPickupPos(loc);
          setFlyTo(loc);
        },
        () => {
          setFlyTo(KASSERINE_CENTER);
        }
      );
    }
  };

  useEffect(() => {
    const hours = new Date().getHours();
    const peak = (hours >= 7 && hours <= 9) || (hours >= 17 && hours <= 20);
    setIsPeak(peak);
    if (peak && !peakNotifiedRef.current) {
      peakNotifiedRef.current = true;
      addNotification('أوقات الذروة', 'الطلب مرتفع الآن بين 7-9 و 17-20', 'alert');
    }
    const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const slow = conn.saveData || (typeof conn.effectiveType === 'string' && /(^|-)(2g|slow-2g)/i.test(conn.effectiveType));
      if (slow) {
        setDataSaverActive(true);
        setTileProvider('osm');
        setMapMaxZoom(15);
        setTileKeepBuffer(3);
        addNotification('توفير البيانات', 'تم تفعيل وضع توفير البيانات تلقائياً', 'info');
      }
    }
  }, []);

  useEffect(() => {
    if (!pickupPos || !destPos) {
      setRouteLine([]);
      setOsrmDistanceKm(null);
      setOsrmDurationMin(null);
      return;
    }
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickupPos[1]},${pickupPos[0]};${destPos[1]},${destPos[0]}?overview=full&geometries=geojson&alternatives=false`;
        const r = await fetch(url);
        const j = await r.json();
        const route = j.routes?.[0];
        if (route?.geometry?.coordinates) {
          const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRouteLine(coords);
          setOsrmDistanceKm(route.distance ? route.distance / 1000 : null);
          setOsrmDurationMin(route.duration ? route.duration / 60 : null);
        } else {
          setRouteLine([]);
        }
      } catch {
        setRouteLine([]);
      }
    };
    fetchRoute();
  }, [pickupPos, destPos]);

  const distance = useMemo(() => {
    if (osrmDistanceKm != null) return osrmDistanceKm;
    if (!pickupPos || !destPos) return 0;
    return calcDistance(pickupPos[0], pickupPos[1], destPos[0], destPos[1]);
  }, [pickupPos, destPos, osrmDistanceKm]);

  const selectedType = rideTypes.find(r => r.id === selectedRideType) || rideTypes[0];
  const basePriceNum = distance > 0 ? Math.max(selectedType.basePrice, (distance * 1.2 * selectedType.basePrice / 2.5)) : selectedType.basePrice;
  const afterPromo = promoApplied ? basePriceNum * (1 - promoApplied.discount / 100) : basePriceNum;
  const estimatedPrice = afterPromo.toFixed(1);
  const estimatedTime = osrmDurationMin != null
    ? Math.max(3, Math.round(osrmDurationMin))
    : distance > 0
    ? Math.max(3, Math.round(distance * 3))
    : selectedType.time;

  const applyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    const offer = offers.find((o) => o.code.toUpperCase() === code && new Date(o.validUntil) >= new Date());
    if (offer) {
      setPromoApplied({ discount: offer.discount, code: offer.code });
    } else {
      setPromoError(t('invalidPromo'));
      setPromoApplied(null);
    }
  };

  const handleBookRide = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setDriverFound(true);
    }, 3000);
  };

  const handleSosConfirm = () => {
    const loc = pickupPos ? `${pickupPos[0]},${pickupPos[1]}` : 'unknown';
    const text = `[Alou SOS] موقع الطوارئ: ${loc} | الوقت: ${new Date().toLocaleTimeString('ar-TN')} | الرقم للطوارئ: 197`;
    navigator.clipboard.writeText(text).then(() => {
      addToast(t('sosSent'), 'info');
      setShowSosConfirm(false);
    });
  };

  const handleShareRide = () => {
    const from = pickupPos ? (pickupLabel || `${pickupPos[0].toFixed(4)}, ${pickupPos[1].toFixed(4)}`) : t('currentLocation');
    const to = destPos ? (destLabel || `${destPos[0].toFixed(4)}, ${destPos[1].toFixed(4)}`) : t('searchDestination');
    const text = `Alou - ${t('shareRide')}\n${t('from')}: ${from}\n${t('to')}: ${to}\n${t('estimatedTime')}: ${estimatedTime} ${t('minutes')}`;
    if (navigator.share) {
      navigator.share({ title: 'Alou', text }).catch(() => navigator.clipboard.writeText(text));
    } else {
      navigator.clipboard.writeText(text);
    }
    addToast(t('shareRide') + ' ✓', 'success');
  };

  const handleEndRide = () => {
    const ride: Ride = {
      id: 'r' + Date.now(),
      pickup: { lat: pickupPos![0], lng: pickupPos![1], address: pickupLabel || (pickupPos ? `${pickupPos[0].toFixed(4)}, ${pickupPos[1].toFixed(4)}` : '') },
      destination: { lat: destPos![0], lng: destPos![1], address: destLabel || (destPos ? `${destPos[0].toFixed(4)}, ${destPos[1].toFixed(4)}` : '') },
      rideType: selectedRideType,
      status: 'completed',
      driver: { id: 'd1', name: 'محمد بن علي', phone: '+21698000001', avatar: '', rating: 4.8, vehicleType: 'sedan', vehicleModel: 'Peugeot 208', vehicleColor: 'أبيض', plateNumber: '125 TN 8400', totalRides: 342 },
      price: parseFloat(estimatedPrice),
      distance,
      duration: estimatedTime,
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod === 'd17' ? 'd17' : paymentMethod === 'wallet' ? 'wallet' : 'cash',
    };
    addRideToHistory(ride);
    setRideToRate({ id: ride.id, driverName: 'محمد بن علي' });
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (stars: number, comment?: string) => {
    if (rideToRate) {
      setRideRating(rideToRate.id, stars);
      addToast(t('thankYou'), 'success');
    }
    setTimeout(() => {
      setShowRatingModal(false);
      setRideToRate(null);
      setShowBooking(false);
      setDriverFound(false);
      setDriverPos(null);
    }, 1500);
  };

  const handleSelectPlace = (place: typeof recentPlaces[0]) => {
    setDestPos([place.lat, place.lng]);
    setFlyTo([place.lat, place.lng]);
    setShowBooking(true);
  };

  const quickGoTo = (lat: number, lng: number, address: string) => {
    setDestPos([lat, lng]);
    setDestLabel(address);
    setFlyTo([lat, lng]);
    setShowBooking(true);
    setMapMode('destination');
  };

  const setFavFromPickup = (kind: 'home' | 'work') => {
    const pos = pickupPos || KASSERINE_CENTER;
    const address = pickupLabel || (pickupPos ? `${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}` : 'الموقع الحالي');
    setFavoritePlace(kind, pos[0], pos[1], address);
    addToast(kind === 'home' ? 'تم حفظ المنزل' : 'تم حفظ العمل', 'success');
  };

  return (
    <div className="h-dvh flex flex-col bg-dark-50 dark:bg-dark-900 safe-top relative">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={KASSERINE_CENTER}
          zoom={14}
          className="w-full h-full z-0"
          zoomControl={false}
          attributionControl={false}
          minZoom={12}
          maxZoom={mapMaxZoom}
          zoomAnimation={false}
          fadeAnimation={false}
          wheelDebounceTime={100}
          whenReady={() => setMapReady(true)}
        >
          {tileProvider === 'carto' ? (
            <TileLayer
              key="carto"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c', 'd']}
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              updateWhenIdle
              updateWhenZooming={false}
              updateInterval={500}
              keepBuffer={tileKeepBuffer}
              detectRetina={false}
              crossOrigin={true}
              maxNativeZoom={16}
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YVbS5kAAAAASUVORK5CYII="
              eventHandlers={{
                tileerror: () => {
                  const now = Date.now();
                  if (now - tileErrorWindowRef.current > 2000) {
                    tileErrorWindowRef.current = now;
                    tileErrorCountRef.current = 1;
                  } else {
                    tileErrorCountRef.current += 1;
                  }
                  if (tileSwitchEnabled && !tileSwitchedRef.current && tileErrorCountRef.current >= 3) {
                    tileSwitchedRef.current = true;
                    setTileProvider('osm');
                  }
                },
              }}
            />
          ) : (
            <TileLayer
              key="osm"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              attribution="&copy; OpenStreetMap contributors"
              updateWhenIdle
              updateWhenZooming={false}
              updateInterval={500}
              keepBuffer={tileKeepBuffer}
              detectRetina={false}
              crossOrigin={true}
              maxNativeZoom={16}
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YVbS5kAAAAASUVORK5CYII="
              eventHandlers={{
                tileerror: () => {
                  const now = Date.now();
                  if (now - tileErrorWindowRef.current > 2000) {
                    tileErrorWindowRef.current = now;
                    tileErrorCountRef.current = 1;
                  } else {
                    tileErrorCountRef.current += 1;
                  }
                  if (tileSwitchEnabled && !tileSwitchedRef.current && tileErrorCountRef.current >= 3) {
                    tileSwitchedRef.current = true;
                    setTileProvider('carto');
                  }
                },
              }}
            />
          )}
          {mapReady && <FlyToLocation center={flyTo} zoom={pickupPos && destPos ? 13 : 15} />}
          <MapClickHandler mode={mapMode} onPickup={handlePickup} onDestination={handleDestination} />

          {/* User position */}
          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>{t('currentLocation')}</Popup>
            </Marker>
          )}
          {isPeak && (
            <>
              <Circle center={KASSERINE_CENTER} radius={1200} pathOptions={{ color: '#FF8A00', opacity: 0.4, fillOpacity: 0.08 }} />
              <Circle center={[KASSERINE_CENTER[0] + 0.01, KASSERINE_CENTER[1] - 0.015]} radius={900} pathOptions={{ color: '#F5B800', opacity: 0.4, fillOpacity: 0.08 }} />
            </>
          )}

          {/* Pickup marker */}
          {pickupPos && (
            <Marker position={pickupPos} icon={pickupIcon}>
              <Popup>📍 {t('from')}</Popup>
            </Marker>
          )}

          {/* Destination marker */}
          {destPos && (
            <Marker position={destPos} icon={destinationIcon}>
              <Popup>🏁 {t('to')}</Popup>
            </Marker>
          )}

          {/* Route line */}
          {routeLine.length > 0 && (
            <Polyline
              positions={routeLine}
              pathOptions={{ color: BRAND_PRIMARY, weight: 5, opacity: 0.95 }}
            />
          )}

          {ghostCars.map((c) => (
            <Marker key={c.id} position={c.path[c.idx]} icon={ghostIcon} />
          ))}

          {/* Driver marker */}
          {driverPos && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>🚕 {t('driverArriving')}</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Map overlay - Header */}
        <div className="absolute top-0 left-0 right-0 z-[1000] p-4">
          <div className="glass rounded-2xl p-3 shadow-lg border border-white/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-dark-500 text-xs">{t('hello')} 👋</p>
                <h1 className="text-dark-900 font-extrabold text-sm">{user?.name || 'Alou'}</h1>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center active:scale-90 transition-transform shadow-md"
              >
                <span className="text-sm">👤</span>
              </button>
            </div>

            {/* Location inputs */}
            <div className="space-y-2">
              <button
                onClick={() => setMapMode('pickup')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start transition-all ${
                  mapMode === 'pickup' ? 'bg-emerald-50 border border-emerald-200' : 'bg-dark-50 border border-transparent'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-dark-700 truncate flex-1" title={pickupLabel}>
                  {pickupPos ? (pickupLabel || `${pickupPos[0].toFixed(4)}, ${pickupPos[1].toFixed(4)}`) : t('currentLocation')}
                </span>
              </button>
              <button
                onClick={() => setMapMode('destination')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start transition-all ${
                  mapMode === 'destination' ? 'bg-red-50 border border-red-200' : 'bg-dark-50 border border-transparent'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs text-dark-700 truncate flex-1" title={destLabel}>
                  {destPos ? (destLabel || `${destPos[0].toFixed(4)}, ${destPos[1].toFixed(4)}`) : t('searchDestination')}
                </span>
              </button>
            </div>
            {(isPeak || dataSaverActive) && (
              <div className="mt-2 flex gap-2">
                {isPeak && <div className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-700">ذروة الآن</div>}
                {dataSaverActive && <div className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-700">توفير بيانات مفعل</div>}
              </div>
            )}
          </div>
        </div>

        {/* Map mode indicator */}
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 z-[1000]">
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${
            mapMode === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {mapMode === 'pickup' ? `📍 ${t('from')}` : `🏁 ${t('to')}`}
          </div>
        </div>

        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          className="absolute bottom-36 end-4 z-[1000] w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform border border-dark-100"
        >
          <Locate size={20} className="text-primary-600" />
        </button>

        {/* Quick actions floating */}
        <div className="absolute bottom-36 start-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setShowSchedule(true)}
            className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform border border-dark-100"
          >
            <Calendar size={18} className="text-dark-600" />
          </button>
          <button
            onClick={() => navigate('/driver-apply')}
            className="w-12 h-12 bg-primary-500 rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform"
          >
            <Car size={18} className="text-dark-900" />
          </button>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="relative z-[1000]">
        {/* Recent places quick scroll + book button */}
        {!showBooking && (
          <div className="bg-white dark:bg-dark-800 rounded-t-3xl shadow-[-4px_-4px_20px_rgba(0,0,0,0.08)] p-4 pb-20">
            <div className="flex gap-2 mb-3">
              {favoriteHome ? (
                <button
                  onClick={() => quickGoTo(favoriteHome.lat, favoriteHome.lng, favoriteHome.address)}
                  className="flex-1 bg-emerald-50 text-emerald-700 rounded-xl py-2 text-xs font-bold"
                >
                  🏠 المنزل
                </button>
              ) : (
                <button
                  onClick={() => setFavFromPickup('home')}
                  className="flex-1 bg-dark-50 text-dark-600 rounded-xl py-2 text-xs font-bold"
                >
                  تعيين المنزل
                </button>
              )}
              {favoriteWork ? (
                <button
                  onClick={() => quickGoTo(favoriteWork.lat, favoriteWork.lng, favoriteWork.address)}
                  className="flex-1 bg-blue-50 text-blue-700 rounded-xl py-2 text-xs font-bold"
                >
                  💼 العمل
                </button>
              ) : (
                <button
                  onClick={() => setFavFromPickup('work')}
                  className="flex-1 bg-dark-50 text-dark-600 rounded-xl py-2 text-xs font-bold"
                >
                  تعيين العمل
                </button>
              )}
            </div>
            {destPos && pickupPos && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowBooking(true)}
                className="btn-primary w-full mb-3 flex items-center justify-center gap-2 text-base"
              >
                <Car size={20} />
                {t('confirmRide')} • {estimatedPrice} {t('currency')}
              </motion.button>
            )}

            <h3 className="font-bold text-dark-800 text-sm mb-2">{t('recentPlaces')}</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {recentPlaces.map((place, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectPlace(place)}
                  className="flex-shrink-0 flex items-center gap-2 bg-dark-50 rounded-xl px-3 py-2.5 active:scale-95 transition-transform"
                >
                  <span className="text-base">{place.emoji}</span>
                  <div className="text-start">
                    <p className="text-xs font-semibold text-dark-800 whitespace-nowrap">{place.name}</p>
                    <p className="text-[10px] text-dark-400 whitespace-nowrap">{place.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Booking Sheet */}
        <AnimatePresence>
          {showBooking && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-dark-800 rounded-t-3xl shadow-[-4px_-4px_20px_rgba(0,0,0,0.15)] max-h-[60vh] overflow-y-auto pb-20"
            >
              {!isSearching && !driverFound ? (
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-dark-900 text-lg">{t('rideDetails')}</h3>
                    <button onClick={() => { setShowBooking(false); setDriverFound(false); }} className="w-8 h-8 rounded-xl bg-dark-100 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Distance info */}
                  {distance > 0 && (
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-dark-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-dark-400">{t('distance')}</p>
                        <p className="font-extrabold text-dark-900 text-sm">{distance.toFixed(1)} {t('km')}</p>
                      </div>
                      <div className="flex-1 bg-dark-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-dark-400">{t('estimatedTime')}</p>
                        <p className="font-extrabold text-dark-900 text-sm">{estimatedTime} {t('minutes')}</p>
                      </div>
                      <div className="flex-1 bg-primary-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-primary-600">{t('estimatedPrice')}</p>
                        <p className="font-extrabold text-primary-700 text-sm">{estimatedPrice} {t('currency')}</p>
                      </div>
                    </div>
                  )}

                  {/* Ride type selector */}
                  <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                    {rideTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedRideType(type.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                          selectedRideType === type.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-dark-100 bg-white'
                        }`}
                      >
                        <span className="text-lg">{type.emoji}</span>
                        <div className="text-start">
                          <p className="text-[11px] font-bold text-dark-800">{t(type.nameKey)}</p>
                          <p className="text-[11px] text-primary-600 font-bold">
                            {distance > 0 ? (Math.max(type.basePrice, distance * 1.2 * type.basePrice / 2.5)).toFixed(1) : type.basePrice} {t('currency')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Payment method */}
                  <p className="text-dark-600 text-sm font-medium mb-2">{t('paymentMethod')}</p>
                  <div className="space-y-2 mb-3">
                    {[
                      { id: 'cash' as const, label: t('cash'), icon: '💵' },
                      { id: 'wallet' as const, label: t('wallet'), icon: '👛' },
                      { id: 'd17' as const, label: t('payWithD17'), icon: '📱' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center justify-between rounded-xl p-3 border-2 transition-all ${
                          paymentMethod === pm.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-dark-100 dark:border-dark-600 bg-dark-50 dark:bg-dark-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 font-medium text-dark-800 dark:text-dark-200">
                          <span>{pm.icon}</span> {pm.label}
                        </span>
                        {paymentMethod === pm.id && <span className="text-primary-600">✓</span>}
                      </button>
                    ))}
                    {paymentMethod === 'd17' && (
                      <div className="mt-2">
                        <label className="text-xs text-dark-500 block mb-1">{t('d17Phone')}</label>
                        <input
                          type="tel"
                          placeholder="+216 98 000 000"
                          className="input-field text-sm dark:bg-dark-700 dark:border-dark-600"
                          value={d17Phone}
                          onChange={(e) => setD17Phone(e.target.value)}
                          dir="ltr"
                        />
                      </div>
                    )}
                  </div>

                  {/* Promo code */}
                  <div className="mb-4">
                    <label className="text-xs text-dark-500 block mb-1">{t('promoCode')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ALOU2026"
                        className="input-field text-sm flex-1 dark:bg-dark-700 dark:border-dark-600 uppercase"
                        value={promoCode}
                        onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-1"
                      >
                        <Tag size={14} />
                        {t('promoCodeApply')}
                      </button>
                    </div>
                    {promoApplied && <p className="text-emerald-600 text-xs mt-1">{t('promoApplied')} -{promoApplied.discount}%</p>}
                    {promoError && <p className="text-red-600 text-xs mt-1">{promoError}</p>}
                  </div>

                  {/* Confirm */}
                  <button
                    onClick={handleBookRide}
                    className="btn-primary w-full text-base flex items-center justify-center gap-2"
                  >
                    <Car size={20} />
                    {t('confirmRide')}
                  </button>
                </div>
              ) : isSearching ? (
                /* Searching animation */
                <div className="p-8 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-4 border-primary-300 animate-ping" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute inset-0 rounded-full bg-primary-50 flex items-center justify-center">
                      <span className="text-3xl animate-car-move">🚕</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-dark-900 text-lg mb-1">{t('searchingDriver')}</h3>
                  <p className="text-dark-400 text-sm">{t('appSlogan')}</p>
                </div>
              ) : (
                /* Driver found */
                <div className="p-5">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="font-bold text-dark-900 text-base">{t('driverFound')}</h3>
                    <p className="text-dark-400 text-xs">{t('driverArriving')}</p>
                  </div>

                  {/* Driver Info */}
                  <div className="bg-dark-50 rounded-2xl p-3 mb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                        <span className="text-xl">👨</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-dark-900 text-sm">محمد بن علي</p>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-primary-500 fill-primary-500" />
                          <span className="text-xs text-dark-600 font-medium">4.8</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-600 bg-white rounded-xl p-2.5">
                      <span>🚗</span>
                      <span className="font-medium">Peugeot 208</span>
                      <span className="text-dark-300">•</span>
                      <span className="font-bold" dir="ltr">125 TN 8400</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mb-3">
                    <button className="flex-1 btn-outline flex items-center justify-center gap-1 text-xs py-2.5">
                      <Phone size={14} />
                      {t('callDriver')}
                    </button>
                    <button onClick={handleShareRide} className="flex-1 btn-outline flex items-center justify-center gap-1 text-xs py-2.5">
                      <Share2 size={14} />
                      {t('shareRide')}
                    </button>
                    <button className="flex-1 btn-outline flex items-center justify-center gap-1 text-xs py-2.5">
                      <MessageCircle size={14} />
                      {t('messageDriver')}
                    </button>
                  </div>

                  <button
                    onClick={handleEndRide}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 mb-2"
                  >
                    <Car size={18} />
                    {t('endRide')}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSosConfirm(true)}
                      className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <Shield size={14} />
                      {t('sos')}
                    </button>
                    <button
                      onClick={() => { setShowBooking(false); setDriverFound(false); setDriverPos(null); }}
                      className="flex-1 bg-dark-100 dark:bg-dark-600 text-dark-600 dark:text-dark-300 font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-transform"
                    >
                      {t('cancelRide')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SOS Confirm Modal */}
      <AnimatePresence>
        {showSosConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSosConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-dark-800 dark:text-white font-medium mb-4">{t('sosConfirm')}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowSosConfirm(false)} className="btn-outline flex-1 py-2.5">
                  {t('cancel')}
                </button>
                <button onClick={handleSosConfirm} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl">
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && rideToRate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4"
            onClick={() => {}}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <RatingModal
                rideId={rideToRate.id}
                driverName={rideToRate.driverName}
                onSubmit={handleRatingSubmit}
                onSkip={() => handleRatingSubmit(0)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-end"
            onClick={() => setShowSchedule(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-white rounded-t-3xl p-6 safe-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-dark-900 text-lg mb-4">{t('scheduleRide')}</h3>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('selectDate')}</label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-dark-500 mb-1 block">{t('selectTime')}</label>
                  <input type="time" className="input-field" />
                </div>
              </div>
              <button
                onClick={() => setShowSchedule(false)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                {t('scheduleConfirm')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
