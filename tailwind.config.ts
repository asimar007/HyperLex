import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        surface: token("surface"),
        ink: token("ink"),
        muted: token("muted"),
        rule: token("rule"),
        accent: token("accent"),
        "accent-ink": token("accent-ink"),
        marker: token("marker"),
        "marker-ink": token("marker-ink"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        serif: ["var(--font-serif)", "Georgia", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [],
};
export default config;
