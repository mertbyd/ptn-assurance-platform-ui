import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  cssVarsPrefix: "acc",
  globalCss: {
    "html, body": {
      minHeight: "100%",
      bg: "app.canvas",
      color: "ink.body",
    },
    body: {
      margin: 0,
      fontFamily: "body",
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
    },
    "a, button, [role=button]": {
      transitionDuration: "180ms",
      transitionProperty: "background-color, border-color, color, opacity, transform",
      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    "button:not(:disabled):active, a[role=button]:active": {
      transform: "translateY(1px) scale(0.99)",
    },
    "tbody tr": {
      transitionDuration: "180ms",
      transitionProperty: "background-color, border-color",
      transitionTimingFunction: "ease-out",
    },
    "tbody tr:hover": {
      bg: "app.subtle",
    },
    "*::selection": {
      bg: "accent.selection",
      color: "ink.strong",
    },
    "*:focus-visible": {
      outline: "2px solid {colors.accent.focus}",
      outlineOffset: "2px",
    },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: "Inter Variable, Inter, system-ui, sans-serif" },
        heading: { value: "Inter Variable, Inter, system-ui, sans-serif" },
      },
      colors: {
        brand: {
          50: { value: "#eef4ff" },
          100: { value: "#dce8ff" },
          200: { value: "#bdd1ff" },
          300: { value: "#91b1ff" },
          400: { value: "#5f88f4" },
          500: { value: "#3566e8" },
          600: { value: "#2453d4" },
          700: { value: "#1944b8" },
          800: { value: "#163b92" },
          900: { value: "#142f6d" },
          950: { value: "#0b1739" },
        },
      },
      radii: {
        control: { value: "12px" },
        panel: { value: "18px" },
      },
    },
    semanticTokens: {
      colors: {
        app: {
          canvas: { value: "#0d0f14" },
          surface: { value: "#131620" },
          elevated: { value: "#181b26" },
          subtle: { value: "#171a24" },
          muted: { value: "#1d2230" },
          hover: { value: "#202637" },
          rail: { value: "#10131b" },
          selected: { value: "var(--acc-dim, rgba(79,144,230,0.13))" },
        },
        ink: {
          strong: { value: "#eaedf4" },
          body: { value: "#c8cfdb" },
          muted: { value: "#8992a6" },
          faint: { value: "#5d6678" },
          onAccent: { value: "#ffffff" },
        },
        line: {
          subtle: { value: "rgba(255,255,255,0.07)" },
          strong: { value: "rgba(255,255,255,0.16)" },
        },
        /* Modül aksanı `--acc` ile gelir; `[data-module="api|db|test"]` bunu
         * globals.css'te yeniden tanımlar. Aşağıdaki `solid/contrast/fg/muted/
         * subtle/emphasized` slotları Chakra v3'ün `colorPalette` sözleşmesidir:
         * bunlar olmadan `colorPalette="accent"` çözülmez ve bileşenler sabit
         * `blue` paletine düşer — API Contract'ın kırmızı yerine mavi görünmesinin
         * sebebi buydu. */
        accent: {
          solid: { value: "var(--acc, #4f90e6)" },
          hover: { value: "var(--acc-hover, #397fd8)" },
          strong: { value: "var(--acc, #4f90e6)" },
          soft: { value: "var(--acc-dim, rgba(79,144,230,0.13))" },
          border: { value: "var(--acc-border, rgba(79,144,230,0.32))" },
          focus: { value: "var(--acc, #4f90e6)" },
          selection: { value: "var(--acc-dim, rgba(79,144,230,0.18))" },
          contrast: { value: "var(--acc-text, #ffffff)" },
          fg: { value: "var(--acc, #4f90e6)" },
          muted: { value: "var(--acc-dim, rgba(79,144,230,0.13))" },
          subtle: { value: "var(--acc-dim, rgba(79,144,230,0.13))" },
          emphasized: { value: "var(--acc-border, rgba(79,144,230,0.32))" },
        },
        state: {
          danger: { value: "#f87171" },
          dangerSoft: { value: "rgba(239,68,68,0.12)" },
          success: { value: "#4ade80" },
          successSoft: { value: "rgba(34,197,94,0.12)" },
          warning: { value: "#fbbf24" },
          warningSoft: { value: "rgba(245,158,11,0.12)" },
          info: { value: "#60a5fa" },
          infoSoft: { value: "rgba(59,130,246,0.12)" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
