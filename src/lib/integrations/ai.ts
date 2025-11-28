import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client lazily
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY_HERE") {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
}

export interface AIResult {
  success: boolean;
  result?: string;
  structured?: Record<string, unknown>;
  error?: string;
}

/**
 * Process text with Claude AI
 */
export async function processWithAI(
  prompt: string,
  systemPrompt?: string
): Promise<AIResult> {
  try {
    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt || "You are a helpful assistant for business automation tasks.",
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const result = textContent ? textContent.text : "";

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI processing failed",
    };
  }
}

/**
 * Extract structured data from text using AI
 */
export async function extractStructuredData(
  text: string,
  schema: Record<string, string>
): Promise<AIResult> {
  const schemaDescription = Object.entries(schema)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join("\n");

  const prompt = `Extract the following information from the text below. Return ONLY valid JSON with these fields:
${schemaDescription}

If a field cannot be found, use null.

Text to analyze:
"""
${text}
"""

Return JSON only, no explanation:`;

  try {
    const result = await processWithAI(prompt, "You are a data extraction assistant. Extract structured data and return valid JSON only.");

    if (!result.success || !result.result) {
      return result;
    }

    // Parse the JSON response
    const jsonMatch = result.result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Could not parse JSON from AI response" };
    }

    const structured = JSON.parse(jsonMatch[0]);
    return { success: true, structured, result: result.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract data",
    };
  }
}

/**
 * Extract contact information from email/text
 */
export async function extractContactInfo(text: string): Promise<AIResult> {
  return extractStructuredData(text, {
    name: "Full name of the person",
    email: "Email address",
    phone: "Phone number",
    company: "Company or organization name",
    title: "Job title or position",
    interest: "What they're interested in or asking about",
    urgency: "low, medium, or high based on tone",
  });
}

/**
 * Summarize text content
 */
export async function summarizeText(
  text: string,
  maxLength: number = 200
): Promise<AIResult> {
  const prompt = `Summarize the following text in ${maxLength} characters or less. Be concise and capture the key points:

${text}`;

  return processWithAI(prompt, "You are a summarization assistant. Create concise, accurate summaries.");
}

/**
 * Classify text into categories
 */
export async function classifyText(
  text: string,
  categories: string[]
): Promise<AIResult> {
  const prompt = `Classify the following text into one of these categories: ${categories.join(", ")}

Text: "${text}"

Return ONLY the category name, nothing else:`;

  return processWithAI(prompt, "You are a text classification assistant.");
}

/**
 * Generate response/reply based on context
 */
export async function generateResponse(
  context: string,
  tone: "professional" | "friendly" | "formal" = "professional"
): Promise<AIResult> {
  const toneInstructions = {
    professional: "Use a professional, business-appropriate tone.",
    friendly: "Use a warm, friendly, and approachable tone.",
    formal: "Use a formal, respectful tone appropriate for official communication.",
  };

  const prompt = `Based on the following context, generate an appropriate response. ${toneInstructions[tone]}

Context:
${context}

Generate a helpful response:`;

  return processWithAI(prompt, "You are a business communication assistant.");
}

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(text: string): Promise<AIResult> {
  return extractStructuredData(text, {
    sentiment: "positive, negative, or neutral",
    confidence: "confidence score from 0 to 1",
    keyPhrases: "array of key phrases that indicate the sentiment",
    summary: "brief explanation of why this sentiment was detected",
  });
}
