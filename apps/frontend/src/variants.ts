import { createVariants } from "#/shared/composables/useVariants.ts";

export const { provideAppVariants, useAppVariants } = createVariants({
  bgBlue: { key: "1", variants: [true, false] as const },
  showFavIcon: { key: "2", variants: [true, false] as const },
});
