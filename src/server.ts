import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

/**
 * This file only runs for local development (`npm run dev` / `npm start`).
 * On Vercel, api/index.ts exports the app directly and the platform's Node
 * runtime handles listening — app.listen() is never called there.
 */
async function main() {
  await connectDB();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server listening on http://localhost:${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
