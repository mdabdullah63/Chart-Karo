const Contact = require("../models/contact.model");
const { userRoom } = require("./presence.socket");

// Latest known position of everyone who is currently sharing: userId -> payload
const activeLocations = new Map();

const AUDIENCE_CACHE_MS = 30 * 1000;
const MIN_EMIT_INTERVAL_MS = 1000;

/**
 * Location is only shared with the sharer's contacts, and only after the sharer
 * explicitly starts sharing from the Location page.
 */
function initializeLocationSocket(io, socket) {
  const userId = socket.user.id.toString();

  let audienceCache = null;
  let audienceCachedAt = 0;
  let lastEmitAt = 0;
  let sharing = false;

  async function getAudience() {
    if (audienceCache && Date.now() - audienceCachedAt < AUDIENCE_CACHE_MS) {
      return audienceCache;
    }
    const rows = await Contact.find({ owner: userId }).select("contact").lean();
    audienceCache = rows.map((row) => row.contact.toString());
    audienceCachedAt = Date.now();
    return audienceCache;
  }

  async function stopSharing() {
    if (!sharing) return;
    sharing = false;
    activeLocations.delete(userId);

    try {
      const audience = await getAudience();
      audience.forEach((id) => io.to(userRoom(id)).emit("location-stopped", { userId }));
    } catch (error) {
      console.error("stop-location error:", error.message);
    }
  }

  socket.on("send-location", async (data) => {
    const lat = Number(data?.lat);
    const lng = Number(data?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    const now = Date.now();
    if (now - lastEmitAt < MIN_EMIT_INTERVAL_MS) return;
    lastEmitAt = now;
    sharing = true;

    const payload = {
      userId,
      userName: socket.profile?.name || "User",
      avatar: socket.profile?.avatar || null,
      lat,
      lng,
      timestamp: new Date(now).toISOString(),
    };
    activeLocations.set(userId, payload);

    try {
      const audience = await getAudience();
      audience.forEach((id) => io.to(userRoom(id)).emit("receive-other-location", payload));
    } catch (error) {
      console.error("send-location error:", error.message);
    }
  });

  socket.on("stop-location", stopSharing);

  // When the Location page opens, send what contacts are already sharing.
  socket.on("request-locations", async () => {
    try {
      const owners = await Contact.find({ contact: userId }).select("owner").lean();
      owners.forEach(({ owner }) => {
        const payload = activeLocations.get(owner.toString());
        if (payload) socket.emit("receive-other-location", payload);
      });
    } catch (error) {
      console.error("request-locations error:", error.message);
    }
  });

  socket.on("disconnect", stopSharing);
}

module.exports = { initializeLocationSocket };
