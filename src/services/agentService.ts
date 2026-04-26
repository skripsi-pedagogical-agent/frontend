import { getAccessToken, refreshAccessToken } from "@/src/services/authService";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AgentChatMessage {
  id: string;
  user_id: string;
  problem_id: string;
  sender: "USER" | "AI";
  message: string;
  created_at: string;
  hint_type?: string;
}

export interface IdleReason {
  id: string;
  code: string;
  description: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface TriggerSystemRequest {
  user_id: string;
  problem_id: string;
  current_user_code: string;
  trigger_type: "inactivity" | "error_burst";
  trigger_payload: Record<string, number>;
}

interface TriggerSystemResponse {
  ai_message: AgentChatMessage;
  hint_intervention_id: string;
}

interface ProblemIdleReasonRequest {
  reason_id: string;
  problem_id: string;
}

interface SendChatRequest {
  sender: "USER";
  message: string;
  current_user_code: string;
}

interface SendChatResponse {
  user_message: AgentChatMessage;
  ai_message: AgentChatMessage;
  hint_type?: string;
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

export async function triggerAgentSystemIntervention(
  payload: TriggerSystemRequest,
): Promise<TriggerSystemResponse> {
  const response = await authorizedFetch(
    buildApiUrl("api/agent/system-trigger"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`System trigger failed: ${response.status}`);
  }

  return (await response.json()) as TriggerSystemResponse;
}

export async function sendAgentChatMessage(
  problemId: string,
  userId: string,
  payload: SendChatRequest,
): Promise<SendChatResponse> {
  const params = new URLSearchParams({
    problem_id: problemId,
    user_id: userId,
  });

  const response = await authorizedFetch(
    `${buildApiUrl("api/chat")}?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Send chat failed: ${response.status}`);
  }

  return (await response.json()) as SendChatResponse;
}

export async function getAgentChatHistory(
  problemId: string,
  userId: string,
): Promise<AgentChatMessage[]> {
  const params = new URLSearchParams({
    problem_id: problemId,
    user_id: userId,
  });

  const response = await authorizedFetch(
    `${buildApiUrl("api/chat")}?${params.toString()}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`Get chat history failed: ${response.status}`);
  }

  return (await response.json()) as AgentChatMessage[];
}

export async function getIdleReasons(): Promise<IdleReason[]> {
  const response = await authorizedFetch(buildApiUrl("api/idle-reasons/"), {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Get idle reasons failed: ${response.status}`);
  }

  const payload = (await response.json()) as PaginatedResponse<IdleReason>;
  return payload.results;
}

export async function submitProblemIdleReason(
  payload: ProblemIdleReasonRequest,
): Promise<void> {
  const response = await authorizedFetch(
    buildApiUrl("api/problem-idle-reason/"),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Submit problem idle reason failed: ${response.status}`);
  }
}
