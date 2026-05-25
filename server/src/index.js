import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import http from "http";

// Routers
import flightsRouter from "./routes/flights.route.js";

// Middlewares
import { arcjetMiddleware } from "./middlewares/arcjet.mw.js";

// Express App
const app = express();
const { NODE_ENV, API_VERSION, PORT } = process.env;

if (NODE_ENV === "production") {
  app.enable("trust proxy");
  app.set("trust proxy", 1);
}

// Security
app.use(helmet());
app.use(cors());

// Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Logging Middleware
if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Landing Page Route
app.get("/", (req, res) => {
  res.send(`Flyte API Server is Up and Running !`);
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Arcjet Middleware
app.use(arcjetMiddleware);

// ---- API Routes ----

// Routes for Flights
app.use(`/v${API_VERSION}/api/flights`, flightsRouter);

// PORT and Server
const server = http.createServer(app);
server.listen(PORT || 8000, () => {
  console.log(`CORS Enabled Server, Listening to port: ${PORT || 8000}...`);
});

export default server;
