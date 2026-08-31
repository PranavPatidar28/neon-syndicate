export function assertLocalRequest(request: Request): void {
  const url = new URL(request.url);
  const isLoopback = (hostname: string) =>
    ['127.0.0.1', 'localhost', '::1'].includes(
      hostname.replace(/^\[|\]$/g, ''),
    );
  const effectivePort = (target: URL) =>
    target.port || (target.protocol === 'https:' ? '443' : '80');
  if (!isLoopback(url.hostname))
    throw new Error('Mission Control is local-only.');
  const origin = request.headers.get('origin');
  if (origin) {
    const source = new URL(origin);
    if (
      !isLoopback(source.hostname) ||
      effectivePort(source) !== effectivePort(url)
    ) {
      throw new Error('Cross-origin mutation rejected.');
    }
  }
}

export function jsonError(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : 'Unexpected local engine error.';
  return Response.json({ error: message }, { status: 400 });
}
