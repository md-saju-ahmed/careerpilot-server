import { createApp } from "../src/app.js";

// Vercel's Node runtime treats this default export as the request handler.
// An Express app instance is itself a valid (req, res) handler function, so
// no app.listen() and no extra adapter is needed here — that only happens
// in src/server.ts, which is used for local dev only.
const app = createApp();

export default app;
