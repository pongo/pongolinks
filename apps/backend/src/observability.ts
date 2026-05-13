import { initLogger } from "evlog";

export const initializeObservability = () => {
  initLogger({
    env: {
      service: "pongolinks-backend",
    },
  });
};
