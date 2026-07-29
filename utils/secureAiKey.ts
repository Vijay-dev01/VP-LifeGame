import * as SecureStore from 'expo-secure-store';

const AI_KEY_STORAGE = 'vprime-openai-api-key';

export async function getSecureApiKey(): Promise<string> {
  try {
    return (await SecureStore.getItemAsync(AI_KEY_STORAGE)) ?? '';
  } catch {
    return '';
  }
}

export async function setSecureApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(AI_KEY_STORAGE);
    return;
  }
  await SecureStore.setItemAsync(AI_KEY_STORAGE, trimmed);
}

export async function clearSecureApiKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AI_KEY_STORAGE);
  } catch {
    // ignore
  }
}
