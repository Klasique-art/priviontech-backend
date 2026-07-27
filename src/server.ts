import "dotenv/config";
import next from "next";
import { createApp } from "./app";
import { env } from "./config/env";

const dev = env.NODE_ENV !== "production";

async function main() {
  const nextApp = next({ dev, hostname: env.HOST, port: env.PORT });
  await nextApp.prepare();
  const app = createApp();
  app.use(nextApp.getRequestHandler() as any);
  app.listen(env.PORT, env.HOST, () =>
    console.log(`Privion ready at http://${env.HOST}:${env.PORT}`),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
