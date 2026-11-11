const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const passport = require("./auth/social/passport");

const { isAllowedOrigin } = require("./config/env");
const authRoutes = require("./auth/auth.routes");
const conversationRoutes = require("./chat/conversation.routes");
const messageRoutes = require("./chat/message.routes");
const contactRoutes = require("./contacts/contact.routes");
const groupRoutes = require("./groups/group.routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const isProd = process.env.NODE_ENV === "production";
const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "font-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "https://router.project-osrm.org", "ws:", "wss:"],
        // keeps http://localhost previews working
        "upgrade-insecure-requests": isProd ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors((req, callback) => {
    const allowed = isAllowedOrigin(req.header("Origin"), req.headers.host);
    callback(null, { origin: allowed, credentials: true });
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(passport.initialize());

if (!isProd) {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.use("/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/groups", groupRoutes);

// ---------- Serve the built React app (single-domain deployment) ----------
const distPath = process.env.CLIENT_DIST || path.join(__dirname, "..", "..", "Frontend", "dist");
const indexFile = path.join(distPath, "index.html");

if (fs.existsSync(indexFile)) {
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  // Any other GET falls through to the SPA so client-side routes survive a refresh.
  app.get(/^\/(?!auth\/|api\/|socket\.io\/|health$).*/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexFile);
  });
  console.log("Serving frontend from", distPath);
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
