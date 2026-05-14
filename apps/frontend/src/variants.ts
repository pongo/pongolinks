import { createVariants } from "#/shared/useVariants.ts";

export const { provideAppVariants, useAppVariants } = createVariants({
  bgBlue: { key: "1", variants: [true, false] as const },
});
