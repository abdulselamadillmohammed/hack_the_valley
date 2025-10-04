const API = "https://87b64aba47d4.ngrok-free.app/api"; // change to your LAN IP if testing on device

type Json = Record<string, any>;

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    ...(opts.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function register(username: string, password: string) {
  return req("/register/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
export async function login(username: string, password: string) {
  const json = await req("/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return json.access as string;
}

// Profiles
export const getProfiles = (token: string) => req("/profiles/", {}, token);
export const createProfile = (
  token: string,
  name: string,
  is_default = false
) =>
  req(
    "/profiles/",
    { method: "POST", body: JSON.stringify({ name, is_default }) },
    token
  );

// Day entries (today default)
export const getOrCreateTodayEntry = (
  token: string,
  profileId: number,
  note?: string
) =>
  req(
    `/profiles/${profileId}/entries/`,
    { method: "POST", body: JSON.stringify({ note }) },
    token
  );

export const getEntry = (token: string, profileId: number, dateISO: string) =>
  req(
    `/profiles/${profileId}/entries/?date=${encodeURIComponent(dateISO)}`,
    {},
    token
  );

export const listDates = (token: string, profileId: number, limit = 30) =>
  req(`/profiles/${profileId}/entries/dates/?limit=${limit}`, {}, token);

export const uploadPhoto = (
  token: string,
  profileId: number,
  entryId: number,
  file: File
) => {
  const fd = new FormData();
  fd.append("file", file);
  return req(
    `/profiles/${profileId}/entries/${entryId}/upload/`,
    { method: "POST", body: fd },
    token
  );
};

export const generateSummary = (
  token: string,
  profileId: number,
  entryId: number,
  style: "short" | "cheerful" | "nostalgic" = "short"
) =>
  req(
    `/profiles/${profileId}/entries/${entryId}/summary/`,
    { method: "POST", body: JSON.stringify({ style }) },
    token
  );
