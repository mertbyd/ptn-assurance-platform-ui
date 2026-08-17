/**
 * Section kimlik sistemi
 * Her route hangi section'a ait → hangi renk paleti aktif
 */

export type SectionId = "default" | "api" | "db" | "test" | "team" | "settings";

export interface SectionConfig {
  id: SectionId;
  /** CSS var(--section-solid) için Chakra token */
  solid: string;
  hover: string;
  soft: string;
  border: string;
  /** Sidebar dark bg */
  sidebarBg: string;
  /** Page canvas rengi */
  canvasBg: string;
  /** Nav item'da gösterilecek renk noktası */
  dotColor: string;
}

export const SECTIONS: Record<SectionId, SectionConfig> = {
  default: {
    id: "default",
    solid: "#2453d4",
    hover: "#1944b8",
    soft: "#eef4ff",
    border: "#91b1ff",
    sidebarBg: "#0b1739",
    canvasBg: "#f4f7fb",
    dotColor: "#2453d4",
  },
  api: {
    id: "api",
    solid: "#7c3aed",
    hover: "#6d28d9",
    soft: "#f5f3ff",
    border: "#c4b5fd",
    sidebarBg: "#2e1065",
    canvasBg: "#f9f7ff",
    dotColor: "#8b5cf6",
  },
  db: {
    id: "db",
    solid: "#059669",
    hover: "#047857",
    soft: "#ecfdf5",
    border: "#6ee7b7",
    sidebarBg: "#022c22",
    canvasBg: "#f0fdf9",
    dotColor: "#10b981",
  },
  test: {
    id: "test",
    solid: "#d97706",
    hover: "#b45309",
    soft: "#fffbeb",
    border: "#fcd34d",
    sidebarBg: "#451a03",
    canvasBg: "#fffdf4",
    dotColor: "#f59e0b",
  },
  team: {
    id: "team",
    solid: "#8b5cf6",
    hover: "#7c3aed",
    soft: "#f5f3ff",
    border: "#c4b5fd",
    sidebarBg: "#2e1065",
    canvasBg: "#f9f7ff",
    dotColor: "#a78bfa",
  },
  settings: {
    id: "settings",
    solid: "#10b981",
    hover: "#059669",
    soft: "#ecfdf5",
    border: "#6ee7b7",
    sidebarBg: "#022c22",
    canvasBg: "#f0fdf9",
    dotColor: "#34d399",
  },
};

/** Route → SectionId haritası */
export const ROUTE_SECTION: Record<string, SectionId> = {
  "/api-contracts": "api",
  "/api-sources":   "api",
  "/api-checks":    "api",
  "/api":           "api",
  "/database":      "db",
  "/db-connections":"db",
  "/db-comparison": "db",
  "/db-runs":       "db",
  "/schema-explorer":"db",
  "/db":            "db",
  "/scenarios":     "test",
  "/runs":          "test",
  "/test":          "test",
  "/team":          "team",
  "/settings":      "settings",
  "/dashboard":     "default",
  "/home":          "default",
};

export function getSectionForPath(pathname: string): SectionId {
  // Tam eşleşme
  if (pathname in ROUTE_SECTION) return ROUTE_SECTION[pathname];
  // Prefix eşleşme
  const match = Object.keys(ROUTE_SECTION).find((k) => pathname.startsWith(k + "/"));
  return match ? ROUTE_SECTION[match] : "default";
}
