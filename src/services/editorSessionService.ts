import { getAccessToken, refreshAccessToken } from "@/src/services/authService";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type EditorSessionStatusId = 1 | 2;

export interface EditorSession {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  status_id: EditorSessionStatusId;
  created_at: string;
  updated_at: string;
}

interface EditorSessionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EditorSession[];
}

export interface UpsertEditorSessionRequest {
  user_id: string;
  problem_id: string;
  code: string;
  status_id: EditorSessionStatusId;
}

function buildApiUrl(path: string): string {
  const normalizedBase = BACKEND_BASE_URL.endsWith("/")
    ? BACKEND_BASE_URL
    : `${BACKEND_BASE_URL}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase).toString();
}

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

export async function getLatestEditorSession(
  problemId: string,
  userId: string,
): Promise<EditorSession | null> {
  const params = new URLSearchParams({
    problem_id: problemId,
    user_id: userId,
  });

  const response = await authorizedFetch(
    `${buildApiUrl("api/editor-sessions/")}?${params.toString()}`,
    {
      method: "GET",
    },
  );

  console.log("Fetch editor session response:", response);

  if (!response.ok) {
    throw new Error(`Get editor session failed: ${response.status}`);
  }

  const data = (await response.json()) as EditorSessionListResponse;
  return data.results[0] ?? null;
}

export async function upsertEditorSession(
  payload: UpsertEditorSessionRequest,
  options?: { keepalive?: boolean },
): Promise<EditorSession> {
  const response = await authorizedFetch(buildApiUrl("api/editor-sessions/"), {
    method: "PUT",
    body: JSON.stringify(payload),
    keepalive: options?.keepalive,
  });

  if (!response.ok) {
    throw new Error(`Save editor session failed: ${response.status}`);
  }

  return (await response.json()) as EditorSession;
}
