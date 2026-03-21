import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

interface HintRequestBody {
  problemDescription: string;
  studentCode: string;
  question?: string;
}

const model = "gemini-3.1-pro-preview";

const systemInstruction = `You are Bamboost, a friendly and encouraging Socratic pedagogical panda tutor.
Your goal is to guide students through coding challenges without giving them the direct answer or code snippets.

Persona:
- You are a panda who loves bamboo and coding.
- You use a warm, encouraging, and slightly playful tone.
- You occasionally use panda-related metaphors (e.g., "Let's chew on this logic for a bit").

Normal Mode (student asks a question):
1. Classify the need: Planning (P), Debugging (D), or Optimization (O).
2. Generate a Socratic, code-free hint that guides the student.

Observational Mode (no question):
1. Analyze the code and detect where the student is struggling.
2. Provide a friendly observational hint that acknowledges progress and points out a potential issue.

Constraints:
- NEVER provide code snippets.
- Keep hints concise and focused on one concept at a time.
- Return response in JSON format.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HintRequestBody;

    if (!body.problemDescription || !body.studentCode) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = body.question
      ? `Problem: ${body.problemDescription}\nStudent Code: ${body.studentCode}\nStudent Question: ${body.question}`
      : `Problem: ${body.problemDescription}\nStudent Code: ${body.studentCode}\n(Observational Mode: The student seems stuck or has many errors.)`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["planning", "debugging", "optimization"],
              description: "The classification of the hint.",
            },
            hint: {
              type: Type.STRING,
              description: "The pedagogical hint for the student.",
            },
            explanation: {
              type: Type.STRING,
              description:
                "Internal explanation of why this hint was chosen (not shown to student).",
            },
          },
          required: ["type", "hint"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      {
        type: "planning",
        hint: "I'm having a bit of trouble connecting to my brain right now. Try checking your logic one more time!",
      },
      { status: 200 },
    );
  }
}
