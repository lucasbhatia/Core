"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Palette,
  Type,
  Layout,
  Image,
  Paintbrush,
  RotateCcw,
  Save,
  Eye,
  Sun,
  Moon,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { ClientTheme, ThemePreset } from "@/types/database";

interface ThemeCustomizerProps {
  clientId: string;
  initialTheme?: ClientTheme | null;
}

const DEFAULT_THEME: Partial<ClientTheme> = {
  primary_color: "#7c3aed",
  secondary_color: "#6366f1",
  accent_color: "#8b5cf6",
  background_color: "#ffffff",
  surface_color: "#f8fafc",
  text_color: "#1e293b",
  text_muted_color: "#64748b",
  border_color: "#e2e8f0",
  success_color: "#22c55e",
  warning_color: "#f59e0b",
  error_color: "#ef4444",
  dark_background_color: "#0f172a",
  dark_surface_color: "#1e293b",
  dark_text_color: "#f1f5f9",
  dark_text_muted_color: "#94a3b8",
  dark_border_color: "#334155",
  font_family: "Inter",
  heading_font_family: "Inter",
  font_size_base: 14,
  border_radius: 8,
  sidebar_style: "default",
  header_style: "default",
  card_style: "default",
  show_powered_by: true,
};

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" },
  { value: "Work Sans", label: "Work Sans" },
  { value: "DM Sans", label: "DM Sans" },
];

export default function ThemeCustomizer({ clientId, initialTheme }: ThemeCustomizerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
  const [theme, setTheme] = useState<Partial<ClientTheme>>(initialTheme || DEFAULT_THEME);

  // Fetch presets on mount
  useEffect(() => {
    async function fetchPresets() {
      try {
        const response = await fetch("/api/portal/theme?presets=true");
        const data = await response.json();
        if (data.presets) {
          setPresets(data.presets);
        }
      } catch (error) {
        console.error("Error fetching presets:", error);
      }
    }
    fetchPresets();
  }, []);

  const handleColorChange = (key: keyof ClientTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: keyof ClientTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof ClientTheme, value: number) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleSwitchChange = (key: keyof ClientTheme, value: boolean) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: ThemePreset) => {
    setTheme({
      ...theme,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
      background_color: preset.background_color,
      surface_color: preset.surface_color,
      text_color: preset.text_color,
      text_muted_color: preset.text_muted_color,
      border_color: preset.border_color,
      success_color: preset.success_color,
      warning_color: preset.warning_color,
      error_color: preset.error_color,
      dark_background_color: preset.dark_background_color,
      dark_surface_color: preset.dark_surface_color,
      dark_text_color: preset.dark_text_color,
      dark_text_muted_color: preset.dark_text_muted_color,
      dark_border_color: preset.dark_border_color,
      font_family: preset.font_family,
      border_radius: preset.border_radius,
    });
    toast({
      title: "Preset Applied",
      description: `"${preset.name}" theme applied. Save to keep changes.`,
    });
  };

  const resetToDefault = () => {
    setTheme(DEFAULT_THEME);
    toast({
      title: "Theme Reset",
      description: "Theme reset to defaults. Save to apply.",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/portal/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, ...theme }),
      });

      if (!response.ok) throw new Error("Failed to save theme");

      toast({
        title: "Theme Saved",
        description: "Your custom theme has been saved successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ColorInput = ({ label, colorKey, description }: { label: string; colorKey: keyof ClientTheme; description?: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md border shadow-sm"
            style={{ backgroundColor: theme[colorKey] as string }}
          />
          <Input
            type="color"
            value={theme[colorKey] as string}
            onChange={(e) => handleColorChange(colorKey, e.target.value)}
            className="w-16 h-8 p-1 cursor-pointer"
          />
        </div>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme Customizer
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize your portal's appearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Theme"}
          </Button>
        </div>
      </div>

      {/* Theme Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Quick Start Presets
          </CardTitle>
          <CardDescription>
            Choose a preset theme as a starting point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="group relative p-3 rounded-lg border hover:border-primary transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: preset.primary_color }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: preset.secondary_color }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: preset.accent_color }}
                    />
                  </div>
                  {preset.is_default && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Customizer */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="colors"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Paintbrush className="w-4 h-4 mr-2" />
                Colors
              </TabsTrigger>
              <TabsTrigger
                value="typography"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Type className="w-4 h-4 mr-2" />
                Typography
              </TabsTrigger>
              <TabsTrigger
                value="layout"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Layout className="w-4 h-4 mr-2" />
                Layout
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Image className="w-4 h-4 mr-2" />
                Branding
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="p-6 space-y-6">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Preview Mode</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === "light" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("light")}
                  >
                    <Sun className="w-4 h-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={previewMode === "dark" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("dark")}
                  >
                    <Moon className="w-4 h-4 mr-1" />
                    Dark
                  </Button>
                </div>
              </div>

              {previewMode === "light" ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Brand Colors</h4>
                    <ColorInput label="Primary" colorKey="primary_color" description="Main brand color" />
                    <ColorInput label="Secondary" colorKey="secondary_color" description="Secondary accent" />
                    <ColorInput label="Accent" colorKey="accent_color" description="Highlights & CTAs" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Surface Colors</h4>
                    <ColorInput label="Background" colorKey="background_color" />
                    <ColorInput label="Surface" colorKey="surface_color" description="Cards & panels" />
                    <ColorInput label="Border" colorKey="border_color" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Text Colors</h4>
                    <ColorInput label="Text" colorKey="text_color" description="Primary text" />
                    <ColorInput label="Muted Text" colorKey="text_muted_color" description="Secondary text" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Status Colors</h4>
                    <ColorInput label="Success" colorKey="success_color" />
                    <ColorInput label="Warning" colorKey="warning_color" />
                    <ColorInput label="Error" colorKey="error_color" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Dark Mode Backgrounds</h4>
                    <ColorInput label="Background" colorKey="dark_background_color" />
                    <ColorInput label="Surface" colorKey="dark_surface_color" />
                    <ColorInput label="Border" colorKey="dark_border_color" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Dark Mode Text</h4>
                    <ColorInput label="Text" colorKey="dark_text_color" />
                    <ColorInput label="Muted Text" colorKey="dark_text_muted_color" />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Body Font</Label>
                  <Select
                    value={theme.font_family}
                    onValueChange={(v) => handleSelectChange("font_family", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label>Heading Font</Label>
                  <Select
                    value={theme.heading_font_family}
                    onValueChange={(v) => handleSelectChange("heading_font_family", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Base Font Size</Label>
                  <span className="text-sm text-muted-foreground">{theme.font_size_base}px</span>
                </div>
                <Slider
                  value={[theme.font_size_base || 14]}
                  onValueChange={([v]) => handleNumberChange("font_size_base", v)}
                  min={12}
                  max={18}
                  step={1}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Border Radius</Label>
                  <span className="text-sm text-muted-foreground">{theme.border_radius}px</span>
                </div>
                <Slider
                  value={[theme.border_radius || 8]}
                  onValueChange={([v]) => handleNumberChange("border_radius", v)}
                  min={0}
                  max={20}
                  step={2}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">Preview</p>
                <div
                  className="p-4 bg-background rounded-lg border"
                  style={{
                    fontFamily: theme.font_family,
                    fontSize: `${theme.font_size_base}px`,
                    borderRadius: `${theme.border_radius}px`,
                  }}
                >
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ fontFamily: theme.heading_font_family }}
                  >
                    Heading Example
                  </h3>
                  <p>This is how your body text will look with the selected settings.</p>
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Sidebar Style</Label>
                  <Select
                    value={theme.sidebar_style}
                    onValueChange={(v) => handleSelectChange("sidebar_style", v as "default" | "compact" | "minimal")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label>Header Style</Label>
                  <Select
                    value={theme.header_style}
                    onValueChange={(v) => handleSelectChange("header_style", v as "default" | "minimal" | "branded")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="branded">Branded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label>Card Style</Label>
                  <Select
                    value={theme.card_style}
                    onValueChange={(v) => handleSelectChange("card_style", v as "default" | "bordered" | "elevated" | "flat")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="bordered">Bordered</SelectItem>
                      <SelectItem value="elevated">Elevated</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show "Powered by" Badge</Label>
                  <p className="text-sm text-muted-foreground">
                    Display CoreOS branding in footer
                  </p>
                </div>
                <Switch
                  checked={theme.show_powered_by}
                  onCheckedChange={(v) => handleSwitchChange("show_powered_by", v)}
                />
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={theme.company_name || ""}
                    onChange={(e) => handleColorChange("company_name" as keyof ClientTheme, e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo URL (Light Mode)</Label>
                  <Input
                    value={theme.logo_url || ""}
                    onChange={(e) => handleColorChange("logo_url" as keyof ClientTheme, e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo URL (Dark Mode)</Label>
                  <Input
                    value={theme.logo_dark_url || ""}
                    onChange={(e) => handleColorChange("logo_dark_url" as keyof ClientTheme, e.target.value)}
                    placeholder="https://example.com/logo-dark.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input
                    value={theme.favicon_url || ""}
                    onChange={(e) => handleColorChange("favicon_url" as keyof ClientTheme, e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Custom CSS (Advanced)</Label>
                <textarea
                  value={theme.custom_css || ""}
                  onChange={(e) => handleColorChange("custom_css" as keyof ClientTheme, e.target.value)}
                  placeholder="/* Add custom CSS overrides here */"
                  className="w-full h-32 px-3 py-2 text-sm border rounded-md font-mono bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Advanced users can add custom CSS to override portal styles
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: previewMode === "light" ? theme.background_color : theme.dark_background_color,
              color: previewMode === "light" ? theme.text_color : theme.dark_text_color,
              fontFamily: theme.font_family,
              fontSize: `${theme.font_size_base}px`,
            }}
          >
            {/* Preview Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: previewMode === "light" ? theme.surface_color : theme.dark_surface_color,
                borderColor: previewMode === "light" ? theme.border_color : theme.dark_border_color,
              }}
            >
              <div className="flex items-center gap-3">
                {theme.logo_url ? (
                  <img src={previewMode === "light" ? theme.logo_url : (theme.logo_dark_url || theme.logo_url)} alt="Logo" className="h-8" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: theme.primary_color }}
                  >
                    {(theme.company_name || "C")[0]}
                  </div>
                )}
                <span className="font-semibold" style={{ fontFamily: theme.heading_font_family }}>
                  {theme.company_name || "Your Portal"}
                </span>
              </div>
              <div
                className="px-3 py-1 rounded text-sm text-white"
                style={{ backgroundColor: theme.primary_color }}
              >
                Button
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: previewMode === "light" ? theme.surface_color : theme.dark_surface_color,
                  borderRadius: `${theme.border_radius}px`,
                  border: theme.card_style === "bordered" ? `1px solid ${previewMode === "light" ? theme.border_color : theme.dark_border_color}` : "none",
                  boxShadow: theme.card_style === "elevated" ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "none",
                }}
              >
                <h4
                  className="font-semibold mb-2"
                  style={{ fontFamily: theme.heading_font_family }}
                >
                  Card Title
                </h4>
                <p
                  style={{ color: previewMode === "light" ? theme.text_muted_color : theme.dark_text_muted_color }}
                >
                  This is how your content cards will appear with your chosen theme settings.
                </p>
                <div className="flex gap-2 mt-3">
                  <span
                    className="px-2 py-1 text-xs rounded text-white"
                    style={{ backgroundColor: theme.success_color }}
                  >
                    Success
                  </span>
                  <span
                    className="px-2 py-1 text-xs rounded text-white"
                    style={{ backgroundColor: theme.warning_color }}
                  >
                    Warning
                  </span>
                  <span
                    className="px-2 py-1 text-xs rounded text-white"
                    style={{ backgroundColor: theme.error_color }}
                  >
                    Error
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
