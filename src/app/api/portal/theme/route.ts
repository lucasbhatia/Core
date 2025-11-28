import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClientTheme, ThemePreset } from "@/types/database";

// GET - Fetch client theme or presets
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const presetsOnly = searchParams.get("presets") === "true";

    if (presetsOnly) {
      // Fetch all public theme presets
      const { data: presets, error } = await supabase
        .from("theme_presets")
        .select("*")
        .eq("is_public", true)
        .order("is_default", { ascending: false });

      if (error) throw error;

      return NextResponse.json({ presets });
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Fetch client's theme
    const { data: theme, error } = await supabase
      .from("client_themes")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // If no custom theme, return default preset
    if (!theme) {
      const { data: defaultPreset } = await supabase
        .from("theme_presets")
        .select("*")
        .eq("is_default", true)
        .single();

      return NextResponse.json({
        theme: null,
        defaultPreset,
        hasCustomTheme: false,
      });
    }

    return NextResponse.json({
      theme,
      hasCustomTheme: true,
    });
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

// POST - Create or update client theme
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { client_id, ...themeData } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Upsert theme (insert or update)
    const { data: theme, error } = await supabase
      .from("client_themes")
      .upsert(
        {
          client_id,
          ...themeData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "client_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ theme, success: true });
  } catch (error) {
    console.error("Error saving theme:", error);
    return NextResponse.json(
      { error: "Failed to save theme" },
      { status: 500 }
    );
  }
}

// DELETE - Reset to default theme
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("client_themes")
      .delete()
      .eq("client_id", clientId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Theme reset to default" });
  } catch (error) {
    console.error("Error deleting theme:", error);
    return NextResponse.json(
      { error: "Failed to reset theme" },
      { status: 500 }
    );
  }
}
