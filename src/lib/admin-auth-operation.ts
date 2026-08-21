export interface AdminAuthClientResult {
  error?: { message?: string | null } | null;
}

export async function runAdminAuthOperation(
  operation: () => Promise<AdminAuthClientResult>,
  fallbackMessage: string,
  onSuccess?: () => void,
): Promise<string | null> {
  try {
    const result = await operation();
    if (result.error) return result.error.message ?? fallbackMessage;
    onSuccess?.();
    return null;
  } catch {
    return fallbackMessage;
  }
}
