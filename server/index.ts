// server/index.ts
import express from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// This immediately invokes an async function to register routes
(async () => {
  await registerRoutes(app);

  // Serve static files from the 'dist/public' directory
  serveStatic(app);
})();

// Export the app for Vercel
export default app;