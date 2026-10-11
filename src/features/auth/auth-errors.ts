// Small helpers for reading errors thrown by apiCall (the axios error is kept as `cause`).

export function errorStatus(err: unknown): number | undefined {
  const e = err as { cause?: { response?: { status?: number } }; response?: { status?: number } };
  return e?.cause?.response?.status ?? e?.response?.status;
}

export function errorText(err: unknown, fallback: string): string {
  if (errorStatus(err) === 429) return 'Too many attempts. Wait a few minutes, then try again.';
  return err instanceof Error && err.message && !err.message.startsWith('Request failed') ? err.message : fallback;
}
