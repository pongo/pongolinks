import { initLogger } from "evlog";

export function initializeObservability() {
  initLogger({
    env: {
      service: "pongolinks-backend",
    },
  });
}
