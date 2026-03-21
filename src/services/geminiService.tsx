export interface HintResponse {
  type: "planning" | "debugging" | "optimization" | "observational";
  hint: string;
  explanation?: string;
}

export async function getPedagogicalHint(
  problemDescription: string,
  studentCode: string,
  question?: string,
): Promise<HintResponse> {
  try {
    const response = await fetch("/api/hint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problemDescription,
        studentCode,
        question,
      }),
    });

    if (!response.ok) {
      throw new Error(`Hint request failed with status ${response.status}`);
    }

    const result = (await response.json()) as HintResponse;
    return result as HintResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      type: "planning",
      hint: "I'm having a bit of trouble connecting to my brain right now. Try checking your logic one more time!",
    };
  }
}
