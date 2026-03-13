import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface HintResponse {
  type: 'planning' | 'debugging' | 'optimization';
  hint: string;
  explanation?: string;
}

export async function getPedagogicalHint(
  problemDescription: string,
  studentCode: string,
  question?: string
): Promise<HintResponse> {
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

  const prompt = question 
    ? `Problem: ${problemDescription}\nStudent Code: ${studentCode}\nStudent Question: ${question}`
    : `Problem: ${problemDescription}\nStudent Code: ${studentCode}\n(Observational Mode: The student seems stuck or has many errors.)`;

  try {
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
              enum: ['planning', 'debugging', 'optimization'],
              description: "The classification of the hint."
            },
            hint: {
              type: Type.STRING,
              description: "The pedagogical hint for the student."
            },
            explanation: {
              type: Type.STRING,
              description: "Internal explanation of why this hint was chosen (not shown to student)."
            }
          },
          required: ['type', 'hint']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as HintResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      type: 'planning',
      hint: "I'm having a bit of trouble connecting to my brain right now. Try checking your logic one more time!"
    };
  }
}
