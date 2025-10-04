// HARD-CODE your backend base here (use your LAN IP)
export const API = "http://5916aeff11f4.ngrok-free.app";
export const WS = API.replace("http", "ws");

export async function api(
  path: string,
  method = "GET",
  body?: any,
  token?: string
) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  try {
    return await res.json();
  } catch {
    return {};
  }
}
