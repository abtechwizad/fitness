export type Theme = "light" | "dark" | "system";

export type AccentColor = "green" | "blue" | "purple" | "orange" | "teal";

const ACCENT_PRESETS: Record<AccentColor, { primary: string; accent: string; gradient: string }> = {
  green: { primary: "160 75% 38%", accent: "160 60% 92%", gradient: "linear-gradient(135deg, hsl(160 75% 38%), hsl(180 65% 40%))" },
  blue: { primary: "217 91% 60%", accent: "217 90% 92%", gradient: "linear-gradient(135deg, hsl(217 91% 60%), hsl(197 90% 45%))" },
  purple: { primary: "270 70% 50%", accent: "270 60% 92%", gradient: "linear-gradient(135deg, hsl(270 70% 50%), hsl(290 65% 45%))" },
  orange: { primary: "25 95% 53%", accent: "25 90% 92%", gradient: "linear-gradient(135deg, hsl(25 95% 53%), hsl(35 95% 45%))" },
  teal: { primary: "173 80% 40%", accent: "173 70% 90%", gradient: "linear-gradient(135deg, hsl(173 80% 40%), hsl(190 75% 35%))" },
};

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace(/^#/, "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return { h: 160, s: 75, l: 38 };
  let r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function applyAccentColor(accent: AccentColor | string) {
  const root = document.documentElement;
  let primary: string, accentLight: string, gradient: string, hue: string;
  if (typeof accent === "string" && accent.startsWith("#")) {
    const { h, s, l } = hexToHsl(accent);
    primary = `${h} ${s}% ${l}%`;
    hue = String(h);
    accentLight = `${h} ${Math.min(s, 60)}% 92%`;
    gradient = `linear-gradient(135deg, hsl(${h}, ${s}%, ${l}%), hsl(${h + 20}, ${s}%, ${Math.max(l - 10, 30)}%))`;
  } else {
    const preset = ACCENT_PRESETS[(accent as AccentColor)] || ACCENT_PRESETS.green;
    primary = preset.primary;
    accentLight = preset.accent;
    gradient = preset.gradient;
    hue = preset.primary.split(" ")[0];
  }
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--accent", accentLight);
  root.style.setProperty("--accent-foreground", `${hue} 75% 25%`);
  root.style.setProperty("--chart-protein", primary);
  root.style.setProperty("--chart-strength", primary);
  root.style.setProperty("--gradient-primary", gradient);
}

export function applyThemeFromStorage() {
  try {
    const u = localStorage.getItem("user");
    if (!u) return;
    const parsed = JSON.parse(u);
    if (parsed.theme) applyTheme(parsed.theme as Theme);
    if (parsed.accentColor) applyAccentColor(parsed.accentColor as AccentColor | string);
  } catch {}
}

export const ACCENT_OPTIONS: { id: AccentColor; label: string; class: string }[] = [
  { id: "green", label: "Green", class: "bg-[hsl(160,75%,38%)]" },
  { id: "blue", label: "Blue", class: "bg-[hsl(217,91%,60%)]" },
  { id: "purple", label: "Purple", class: "bg-[hsl(270,70%,50%)]" },
  { id: "orange", label: "Orange", class: "bg-[hsl(25,95%,53%)]" },
  { id: "teal", label: "Teal", class: "bg-[hsl(173,80%,40%)]" },
];
