let pendingLegacyApiKey: string | null = null;

export function stashLegacyApiKey(key: string): void {
  if (key.trim()) pendingLegacyApiKey = key.trim();
}

export function consumeLegacyApiKey(): string | null {
  const key = pendingLegacyApiKey;
  pendingLegacyApiKey = null;
  return key;
}
