import { defineConfig } from "vitest/config";
export default defineConfig({ test:{environment:"node",setupFiles:["./tests/setup.ts"],coverage:{reporter:["text"]}},resolve:{alias:{"@":new URL("./src",import.meta.url).pathname}} });
