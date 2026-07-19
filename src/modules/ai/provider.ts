import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/ApiError.js";

/**
 * Centralized AI provider layer.
 * All AI-related modules use this file instead of interacting directly
 * with the Gemini SDK, making it easier to switch providers later.
 */

const MODEL = "gemini-3.5-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new ApiError(
      500,
      "GEMINI_API_KEY is not configured on the server",
      false,
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  return client;
}

/**
 * Generates a JSON response from the AI model.
 *
 * The caller is responsible for validating the returned data
 * (e.g. using Zod) and handling retries when necessary.
 */
export async function generateJSON(
  prompt: string,
  schemaHint: string,
): Promise<unknown> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      systemInstruction:
        "You are a precise assistant that responds ONLY with valid JSON, " +
        "no markdown code fences, no commentary before or after. The JSON " +
        `must match this shape: ${schemaHint}`,
    },
  });

  const content = response.text;

  if (!content) {
    throw new ApiError(502, "AI provider returned an empty response", false);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("AI provider response was not valid JSON");
  }
}

/**
 * Generates a plain-text response from the AI model.
 */
export async function generateText(prompt: string): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.6,
    },
  });

  const content = response.text;

  if (!content) {
    throw new ApiError(502, "AI provider returned an empty response", false);
  }

  return content.trim();
}
