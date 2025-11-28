"use client";

import { useTheme, Mode, Theme } from "@/components/providers/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Palette, Check } from "lucide-react";

const modes: { value: Mode; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

const themes: { value: Theme; label: string; colors: { primary: string; accent: string } }[] = [
  { value: "default", label: "Purple", colors: { primary: "#7c3aed", accent: "#a78bfa" } },
  { value: "ocean", label: "Ocean", colors: { primary: "#0ea5e9", accent: "#38bdf8" } },
  { value: "forest", label: "Forest", colors: { primary: "#22c55e", accent: "#4ade80" } },
  { value: "sunset", label: "Sunset", colors: { primary: "#f97316", accent: "#fb923c" } },
  { value: "slate", label: "Slate", colors: { primary: "#475569", accent: "#64748b" } },
];

export function ThemeSettings() {
  const { mode, theme, portalTheme, setMode, setTheme, setPortalTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance Mode
          </CardTitle>
          <CardDescription>Choose between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {modes.map((m) => (
              <Button
                key={m.value}
                variant={mode === m.value ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setMode(m.value)}
              >
                {m.icon}
                {m.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Admin Dashboard Theme
          </CardTitle>
          <CardDescription>Choose a color theme for the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                  theme === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: t.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: t.colors.accent }}
                  />
                </div>
                <span className="text-xs font-medium">{t.label}</span>
                {theme === t.value && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portal Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Client Portal Theme
          </CardTitle>
          <CardDescription>Choose a color theme for the client portal (separate from admin)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setPortalTheme(t.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                  portalTheme === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: t.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: t.colors.accent }}
                  />
                </div>
                <span className="text-xs font-medium">{t.label}</span>
                {portalTheme === t.value && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Preview</CardTitle>
          <CardDescription>See how your selected theme looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Buttons</Label>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary" title="Primary" />
                <div className="w-10 h-10 rounded-lg bg-secondary" title="Secondary" />
                <div className="w-10 h-10 rounded-lg bg-muted" title="Muted" />
                <div className="w-10 h-10 rounded-lg bg-accent" title="Accent" />
                <div className="w-10 h-10 rounded-lg bg-destructive" title="Destructive" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
