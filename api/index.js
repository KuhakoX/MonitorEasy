import app from "../src/backend/app.js";

export default function handler(request, response) {
  const requestUrl = new URL(request.url, "http://vercel.local");
  const route = requestUrl.searchParams.get("__route");

  if (route !== null) {
    requestUrl.searchParams.delete("__route");
    const query = requestUrl.searchParams.toString();
    request.url = `/api/${route.replace(/^\/+/, "")}${query ? `?${query}` : ""}`;
  }

  return app(request, response);
}
