export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, number>;
};

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? "https://priviontech-api.onrender.com" : "")
).replace(/\/+$/, "");

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiOrigin}/api/v1${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const body = await response.json();
  if (!response.ok) {
    const details = body.error?.fields
      ? ` ${Object.values(body.error.fields).join(" ")}`
      : "";
    throw new Error(`${body.error?.message ?? "Request failed"}${details}`);
  }
  return (body as ApiResponse<T>).data;
}
