const parseFrontendUrl = (baseUrl: string | undefined) => {
  const configuredUrl = String(baseUrl || "").trim();
  if (!configuredUrl) {
    throw new Error(
      "Frontend URL is not configured. Set FRONTEND_URL or FRONTEND_ADMIN_URL as appropriate",
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error(`Frontend URL is invalid: ${configuredUrl}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Frontend URL must use http or https");
  }

  return url;
};

export const buildFrontendUrl = (
  baseUrl: string | undefined,
  options: {
    path?: string;
    query?: Record<string, string>;
  } = {},
) => {
  const url = parseFrontendUrl(baseUrl);

  if (options.path) {
    const basePath = url.pathname.replace(/\/+$/, "");
    const requestedPath = options.path.startsWith("/")
      ? options.path
      : `/${options.path}`;
    url.pathname = `${basePath}${requestedPath}`;
  }

  for (const [key, value] of Object.entries(options.query || {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
};
