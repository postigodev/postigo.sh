export function safeAdminNextPath(
  candidate: string,
  fallback = '/admin',
): string {
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return fallback;
  }

  const base = new URL('https://portfolio.invalid');
  const resolved = new URL(candidate, base);
  if (resolved.origin !== base.origin) return fallback;

  return `${resolved.pathname}${resolved.search}`;
}

export function adminLoginRedirect(requestUrl: URL): string {
  const next = safeAdminNextPath(`${requestUrl.pathname}${requestUrl.search}`);
  return `/admin/login?next=${encodeURIComponent(next)}`;
}
