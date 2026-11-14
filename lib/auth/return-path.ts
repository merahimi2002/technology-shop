export function getSignInReturnPath(
  callbackUrl: string | null,
  origin: string,
  homePath: string,
) {
  if (!callbackUrl) return homePath;

  try {
    const destination = new URL(callbackUrl, origin);
    if (
      destination.origin === origin &&
      (destination.protocol === 'http:' || destination.protocol === 'https:') &&
      !destination.pathname.startsWith('//')
    ) {
      return destination.pathname + destination.search + destination.hash;
    }
  } catch {
    // Invalid destinations return to the localized home page.
  }
  return homePath;
}
