export type EntityTheme = {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
};

const DEFAULTS = {
  primaryColor: "#121417",
  secondaryColor: "#667085",
  accentColor: "#2766ab",
} as const;

export function applyEntityTheme(theme: EntityTheme) {
  const root = document.documentElement;
  const primary = theme.primaryColor || DEFAULTS.primaryColor;
  const secondary = theme.secondaryColor || DEFAULTS.secondaryColor;
  const accent = theme.accentColor || DEFAULTS.accentColor;

  root.style.setProperty("--hoofdkleur", primary);
  root.style.setProperty("--steunkleur", secondary);
  root.style.setProperty("--accentkleur", accent);
  root.style.setProperty("--ink", primary);
  root.style.setProperty("--muted", secondary);
  root.style.setProperty("--accent", accent);
}
