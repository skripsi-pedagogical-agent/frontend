export interface BackendProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  method_name: string;
  starter_code: string;
  topic: string;
  created_at: string;
  updated_at: string;
}

export interface BackendProblemsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProblem[];
}

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchProblemsFromBackend(): Promise<BackendProblemsResponse> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/problems/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch problems: ${response.status}`);
    }

    const data = (await response.json()) as BackendProblemsResponse;
    return data;
  } catch (error) {
    console.error("Error fetching problems from backend:", error);
    throw error;
  }
}
