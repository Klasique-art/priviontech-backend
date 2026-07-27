import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";

async function main() {
  const app = createApp();
  app.get("/", (_request, response) => {
    response.json({
      success: true,
      data: {
        service: "Privion Technologies API",
        version: "v1",
        health: "/api/v1/health",
        documentation: "/api/docs",
      },
    });
  });
  app.listen(env.PORT, env.HOST, () =>
    console.log(`Privion ready at http://${env.HOST}:${env.PORT}`),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
