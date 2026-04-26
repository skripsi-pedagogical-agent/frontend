import { getAccessToken, refreshAccessToken } from "./authService";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TelemetryLogPayload {
  problem: string;
  action_type: string;
  hint_type: string;
  code_snapshot: string;
  metadata: Record<string, unknown>;
}

export async function logTelemetry(
  payload: TelemetryLogPayload,
): Promise<void> {
  let token = getAccessToken();

  let response = await fetch(`${BACKEND_BASE_URL}/api/telemetry/log/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await fetch(`${BACKEND_BASE_URL}/api/telemetry/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify(payload),
      });
    }
  }

  if (!response.ok) {
    console.error("Failed to log telemetry:", await response.text());
  }
}
