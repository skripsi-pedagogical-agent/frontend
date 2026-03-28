export interface BackendProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  method_name: string;
  starter_code: string;
  topic: string;
  test_cases: {
    id: string;
    input_data: string;
    expected_output: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface BackendProblemsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProblem[];
}

export interface SubmitProblemRequest {
  user_id: string;
  problem_id: string;
  source_code: string;
}

export interface RunTestCaseRequest {
  problem_id: string;
  source_code: string;
}

export interface SubmissionJudgeResultItem {
  status: string;
  message: string;
  output: string | null;
  expected: string | null;
  error: string | null;
  time_used: number | null;
  memory_used: number | null;
  test_case_id: string;
}

export interface SubmissionJudgeResult {
  overall_status: string;
  overall_message: string;
  max_time: number;
  max_memory: number;
  results: SubmissionJudgeResultItem[];
}

export interface SubmissionResponse {
  id: string;
  user: string;
  problem: string;
  submission_number: number;
  source_code: string;
  verdict: string;
  output: string;
  execution_time: number;
  memory_used: number;
  created_at: string;
  judge_result: SubmissionJudgeResult;
}

export interface RunTestCaseResponse {
  judge_result: SubmissionJudgeResult;
}

import { getAccessToken, refreshAccessToken } from "@/src/services/authService";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function mergeHeaders(base: HeadersInit, extra?: HeadersInit): HeadersInit {
  return {
    ...(base as Record<string, string>),
    ...(extra as Record<string, string>),
  };
}

async function authorizedFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const accessToken = getAccessToken();

  const firstResponse = await fetch(url, {
    ...init,
    headers: mergeHeaders(defaultHeaders, {
      ...((init.headers as Record<string, string>) || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    }),
  });

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) {
    return firstResponse;
  }

  return fetch(url, {
    ...init,
    headers: mergeHeaders(defaultHeaders, {
      ...((init.headers as Record<string, string>) || {}),
      Authorization: `Bearer ${newAccessToken}`,
    }),
  });
}

export async function fetchProblemsFromBackend(): Promise<BackendProblemsResponse> {
  try {
    const response = await authorizedFetch(
      `${BACKEND_BASE_URL}/api/problems/`,
      {
        method: "GET",
      },
    );

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

export async function submitProblemToBackend(
  payload: SubmitProblemRequest,
): Promise<SubmissionResponse> {
  try {
    const response = await authorizedFetch(`${BACKEND_BASE_URL}/api/submit/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit problem: ${response.status}`);
    }

    const data = (await response.json()) as SubmissionResponse;
    return data;
  } catch (error) {
    console.error("Error submitting problem to backend:", error);
    throw error;
  }
}

export async function runTestCaseOnBackend(
  payload: RunTestCaseRequest,
): Promise<RunTestCaseResponse> {
  try {
    const response = await authorizedFetch(
      `${BACKEND_BASE_URL}/api/run-testcase/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to run test case: ${response.status}`);
    }

    const data = (await response.json()) as RunTestCaseResponse;
    return data;
  } catch (error) {
    console.error("Error running test case on backend:", error);
    throw error;
  }
}
