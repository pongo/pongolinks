import { mkdirSync } from "node:fs";

mkdirSync(new URL("../.data", import.meta.url), { recursive: true });
