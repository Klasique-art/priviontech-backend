import "dotenv/config";

import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

const server = express();

server.disable("x-powered-by");
server.use(
  helmet({
    contentSecurityPolicy: dev ? false : undefined,
  }),
);
server.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true,
    credentials: true,
  }),
);
server.use(express.json({ limit: "1mb" }));
server.use(express.urlencoded({ extended: true }));

server.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    status: "ok",
    service: "priviontech-backend",
    timestamp: new Date().toISOString(),
  });
});

server.all("*splat", (request: Request, response: Response) => {
  return handle(request, response);
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: "Internal server error",
  });
};

server.use(errorHandler);

server.listen(port, hostname, () => {
  console.log(`> Server ready at http://${hostname}:${port}`);
});
