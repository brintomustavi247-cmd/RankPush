import type { Config } from "tailwindcss";

/**
 * Tailwind v4: primary entry is `@import "tailwindcss"` in `app/globals.css`.
 * This file extends scanning so every UI surface (app, components, lib, contexts)
 * is included even when class names are built dynamically.
 */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config;
