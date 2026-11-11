const jwt = require("jsonwebtoken");
const userRepository = require("../users/user.repository");

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [key, ...rest] = entry.split("=");
        let value = rest.join("=");
        try {
          value = decodeURIComponent(value);
        } catch {
          /* keep raw value */
        }
        return [key, value];
      })
  );
}

async function socketAuth(socket, next) {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error("Authentication required"));
    }

    const token = parseCookies(cookieHeader).accessToken;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findById(payload.id);
    if (!user || user.isActive === false) {
      return next(new Error("Authentication required"));
    }

    socket.user = payload;
    socket.profile = { name: user.name, avatar: user.avatar || null };
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
}

module.exports = { socketAuth };
