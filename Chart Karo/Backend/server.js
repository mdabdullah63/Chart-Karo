const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy Backend/.env.example to Backend/.env (or set them in your host dashboard).");
  process.exit(1);
}

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { verifyMailConnection } = require("./src/config/mail");
const { initializeSocket } = require("./src/socket");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = initializeSocket(server);
app.set("io", io);

async function startServer() {
  try {
    await connectDB();
    await verifyMailConnection();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  io.close();
  server.close(() => process.exit(0));
});

startServer();
