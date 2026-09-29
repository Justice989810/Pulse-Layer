export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function fetchApiJson<T>(
  url: string,
  isValid: (value: unknown) => value is T,
): Promise<T> {
  const response = await fetch(url);
  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : response.statusText;
    throw new Error(`API request failed (${response.status})${message ? `: ${message}` : ''}`);
  }

  if (!isValid(payload)) {
    throw new Error('API returned an unexpected response.');
  }

  return payload;
}