import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const { description, clientName } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are an automation tool designer. Given a description of what a client needs, you create a complete AI tool configuration.

Your response must be valid JSON with this exact structure:
{
  "name": "Short tool name (3-5 words)",
  "description": "One sentence describing what the tool does",
  "system_prompt": "Detailed instructions for the AI that will power this tool. Be specific about tone, format, and what the AI should produce.",
  "input_fields": [
    {
      "name": "field_name_snake_case",
      "label": "Human Readable Label",
      "type": "text|textarea|email|url|number",
      "placeholder": "Example placeholder text",
      "required": true
    }
  ],
  "output_format": "markdown|text|json|html"
}

Guidelines:
- Create 2-5 relevant input fields based on what information the AI needs
- The system_prompt should be detailed and produce high-quality, usable output
- Use "textarea" for longer inputs, "text" for short ones
- Output format should match what's most useful (markdown for formatted content, json for structured data)
- Make the tool immediately usable - clients should get real value from the output`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Create an AI tool for this client need:\n\nClient: ${clientName || "General"}\n\nDescription: ${description}\n\nRespond with only the JSON configuration, no other text.`,
        },
      ],
    });

    const responseContent = message.content[0];
    const responseText = responseContent.type === "text" ? responseContent.text : "";

    // Parse the JSON response
    let toolConfig;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        toolConfig = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse tool config:", responseText);
      return NextResponse.json(
        { error: "Failed to generate tool configuration" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!toolConfig.name || !toolConfig.system_prompt || !toolConfig.input_fields) {
      return NextResponse.json(
        { error: "Invalid tool configuration generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tool: {
        name: toolConfig.name,
        description: toolConfig.description || "",
        system_prompt: toolConfig.system_prompt,
        input_fields: toolConfig.input_fields,
        output_format: toolConfig.output_format || "markdown",
        tool_type: "ai_generator",
      },
    });
  } catch (error) {
    console.error("Tool generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate tool" },
      { status: 500 }
    );
  }
}
