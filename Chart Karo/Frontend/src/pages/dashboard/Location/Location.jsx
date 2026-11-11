import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MdMyLocation, MdShare, MdStop, MdPeople } from "react-icons/md";
import { useOutletContext } from "react-router-dom";

import { useSocket } from "../../../context/SocketContext";
import { resolveAssetUrl } from "../../../config/env";
import "./Location.css";

const DEFAULT_CENTER = [20.5937, 78.9629];
const SEND_INTERVAL_MS = 3000;
const ROUTE_MIN_INTERVAL_MS = 5000;

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

function geoErrorMessage(error) {
  if (error?.code === 1) return "Location permission was denied. Allow it in your browser settings.";
  if (error?.code === 2) return "Your position is unavailable right now. Please try again.";
  if (error?.code === 3) return "Finding your position took too long. Please try again.";
  return "Unable to detect your location.";
}

// Markers/popups are built with DOM APIs (never HTML strings) so names can't inject markup.
function buildMarkerIcon(name, avatarUrl, isMe) {
  const initial = (name || "U").trim().charAt(0).toUpperCase() || "U";
  const wrapper = document.createElement("div");
  wrapper.className = `user-marker${isMe ? " is-me" : ""}`;

  const showInitial = () => {
    wrapper.classList.add("user-marker-fallback");
    wrapper.textContent = initial;
  };

  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.alt = name || "User";
    img.onerror = () => {
      img.remove();
      showInitial();
    };
    wrapper.appendChild(img);
  } else {
    showInitial();
  }

  return L.divIcon({
    className: "user-map-marker",
    html: wrapper,
    iconSize: [52, 64],
    iconAnchor: [26, 64],
    popupAnchor: [0, -64],
  });
}

function popupElement(text) {
  const el = document.createElement("strong");
  el.textContent = text;
  return el;
}

export default function Location() {
  const { user } = useOutletContext();
  const { socket, connected } = useSocket();

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const myMarkerRef = useRef(null);
  const otherMarkersRef = useRef(new Map());
  const routeLayerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);
  const sharingRef = useRef(false);
  const routeStampRef = useRef(0);
  const positionHandlerRef = useRef(() => {});
  const stopSharingRef = useRef(() => {});
  const latestRef = useRef({ myPosition: null, target: null });

  const [myPosition, setMyPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [people, setPeople] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [roadDistance, setRoadDistance] = useState(null);

  const userName = user?.name || "You";
  const userAvatar = resolveAssetUrl(user?.avatar);

  // ---------- Map ----------
  useEffect(() => {
    const map = L.map(mapElRef.current, { zoomControl: true }).setView(DEFAULT_CENTER, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapElRef.current);
    const markers = otherMarkersRef.current;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      myMarkerRef.current = null;
      routeLayerRef.current = null;
      markers.clear();
    };
  }, []);

  // ---------- Position updates ----------
  positionHandlerRef.current = (position, { fly = false } = {}) => {
    const { latitude, longitude } = position.coords;
    const point = [latitude, longitude];
    setMyPosition({ lat: latitude, lng: longitude });

    const map = mapRef.current;
    if (!map) return;

    if (!myMarkerRef.current) {
      myMarkerRef.current = L.marker(point, {
        icon: buildMarkerIcon(userName, userAvatar, true),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(popupElement(`${userName} (You)`));
    } else {
      myMarkerRef.current.setLatLng(point);
    }

    if (fly) map.flyTo(point, 16, { animate: true, duration: 0.8 });

    if (sharingRef.current && socket) {
      const now = Date.now();
      if (now - lastSentRef.current >= SEND_INTERVAL_MS) {
        lastSentRef.current = now;
        socket.emit("send-location", { lat: latitude, lng: longitude });
      }
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setError("");
    setIsLocating(true);

    const onSuccess = (position) => {
      setIsLocating(false);
      positionHandlerRef.current(position, { fly: true });
    };
    const onFail = (err) => {
      setIsLocating(false);
      setError(geoErrorMessage(err));
    };

    // Fast low-accuracy fix first, GPS as a fallback.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === 1) return onFail(err);
        navigator.geolocation.getCurrentPosition(onSuccess, onFail, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
        return undefined;
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sharingRef.current) {
      sharingRef.current = false;
      socket?.emit("stop-location");
    }
    setSharing(false);
  }, [socket]);

  stopSharingRef.current = stopSharing;

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    if (!socket || !connected) {
      setError("You are offline. Please wait for the connection and try again.");
      return;
    }

    setError("");
    sharingRef.current = true;
    lastSentRef.current = 0;
    setSharing(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => positionHandlerRef.current(position, { fly: !myMarkerRef.current }),
      (err) => {
        setError(geoErrorMessage(err));
        if (err.code === 1) stopSharingRef.current();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  };

  // Stop sharing when leaving the page.
  useEffect(() => () => stopSharingRef.current(), []);

  // ---------- Contacts sharing with me ----------
  useEffect(() => {
    if (!socket) return undefined;

    const onLocation = (data) => {
      if (!data?.userId) return;
      setPeople((prev) => ({ ...prev, [data.userId]: data }));
    };

    const onStopped = ({ userId }) => {
      setPeople((prev) => {
        if (!(userId in prev)) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setSelectedId((current) => (current === userId ? null : current));
    };

    socket.on("receive-other-location", onLocation);
    socket.on("location-stopped", onStopped);
    if (connected) socket.emit("request-locations");

    return () => {
      socket.off("receive-other-location", onLocation);
      socket.off("location-stopped", onStopped);
    };
  }, [socket, connected]);

  // Keep markers in sync with who is sharing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = otherMarkersRef.current;

    Object.values(people).forEach((person) => {
      const point = [person.lat, person.lng];
      const existing = markers.get(person.userId);

      if (existing) {
        existing.setLatLng(point);
      } else {
        const marker = L.marker(point, {
          icon: buildMarkerIcon(person.userName, resolveAssetUrl(person.avatar), false),
        })
          .addTo(map)
          .bindPopup(popupElement(person.userName || "Contact"));
        markers.set(person.userId, marker);
      }
    });

    markers.forEach((marker, id) => {
      if (!people[id]) {
        marker.remove();
        markers.delete(id);
      }
    });
  }, [people]);

  // ---------- Selected contact: fit map + road route ----------
  const target = selectedId ? people[selectedId] : null;
  latestRef.current = { myPosition, target };

  const routeKey =
    target && myPosition
      ? [
          selectedId,
          myPosition.lat.toFixed(4),
          myPosition.lng.toFixed(4),
          target.lat.toFixed(4),
          target.lng.toFixed(4),
        ].join("|")
      : null;

  useEffect(() => {
    const map = mapRef.current;
    const { myPosition: me, target: person } = latestRef.current;
    if (!map || !person) return;

    if (me) {
      map.fitBounds(
        [
          [me.lat, me.lng],
          [person.lat, person.lng],
        ],
        { padding: [70, 70], maxZoom: 16 }
      );
    } else {
      map.flyTo([person.lat, person.lng], 15);
    }
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;

    const clearRoute = () => {
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
    };

    const { myPosition: me, target: person } = latestRef.current;

    if (!map || !routeKey || !me || !person) {
      clearRoute();
      setRoadDistance(null);
      return undefined;
    }

    const controller = new AbortController();
    const wait = Math.max(0, ROUTE_MIN_INTERVAL_MS - (Date.now() - routeStampRef.current));

    const timer = setTimeout(async () => {
      routeStampRef.current = Date.now();
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${me.lng},${me.lat};${person.lng},${person.lat}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Route request failed");

        const data = await response.json();
        const route = data.routes?.[0];

        clearRoute();
        if (data.code !== "Ok" || !route) {
          setRoadDistance(null);
          return;
        }

        routeLayerRef.current = L.geoJSON(route.geometry, {
          style: { weight: 5, opacity: 0.85, color: "#6366f1" },
        }).addTo(map);
        setRoadDistance(route.distance);
      } catch (err) {
        if (err.name !== "AbortError") {
          clearRoute();
          setRoadDistance(null);
        }
      }
    }, wait);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [routeKey]);

  // ---------- Derived list ----------
  const peopleList = useMemo(() => {
    const list = Object.values(people).map((person) => ({
      ...person,
      meters: myPosition ? haversineMeters(myPosition, person) : null,
    }));
    return list.sort((a, b) => (a.meters ?? 0) - (b.meters ?? 0));
  }, [people, myPosition]);

  return (
    <div className="location-page">
      <div className="location-toolbar">
        <div className="location-title">
          <h2>Live location</h2>
          <p>Share where you are with your contacts and see who is sharing with you.</p>
        </div>

        <div className="location-buttons">
          <button type="button" className="location-btn" onClick={locateMe} disabled={isLocating}>
            <MdMyLocation className={`location-icon ${isLocating ? "spinning" : ""}`} />
            {isLocating ? "Locating..." : "Find me"}
          </button>

          {sharing ? (
            <button type="button" className="location-btn danger" onClick={stopSharing}>
              <MdStop className="location-icon" />
              Stop sharing
            </button>
          ) : (
            <button type="button" className="location-btn primary" onClick={startSharing}>
              <MdShare className="location-icon" />
              Share live location
            </button>
          )}
        </div>
      </div>

      {sharing && (
        <div className="location-live-badge">
          <span className="live-dot" />
          Your contacts can see your live location
        </div>
      )}

      {error && (
        <div className="location-error" role="alert">
          {error}
        </div>
      )}

      <div className="location-body">
        <div className="location-map-wrap">
          <div ref={mapElRef} className="location-map" />

          {roadDistance !== null && (
            <div className="distance-badge">
              Road distance <strong>{formatDistance(roadDistance)}</strong>
            </div>
          )}
        </div>

        <aside className="location-people">
          <h3>
            <MdPeople aria-hidden="true" />
            Sharing with you
            <span>{peopleList.length}</span>
          </h3>

          {peopleList.length === 0 ? (
            <p className="location-people-empty">
              When a contact starts sharing their live location, they will show up here.
            </p>
          ) : (
            <ul>
              {peopleList.map((person) => (
                <li key={person.userId}>
                  <button
                    type="button"
                    className={`location-person ${selectedId === person.userId ? "active" : ""}`}
                    onClick={() =>
                      setSelectedId((current) => (current === person.userId ? null : person.userId))
                    }
                  >
                    <span className="location-person-avatar">
                      {person.userName?.trim()?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <span className="location-person-info">
                      <strong>{person.userName || "Contact"}</strong>
                      <small>
                        {person.meters !== null
                          ? `${formatDistance(person.meters)} away`
                          : "Tap “Find me” to see distance"}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
