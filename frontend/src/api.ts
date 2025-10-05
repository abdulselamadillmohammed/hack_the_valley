// src/api.ts
export const API =
  (import.meta as any)?.env?.VITE_API_BASE ??
  "https://87b64aba47d4.ngrok-free.app/api";

function preview(s: string, n = 200) {
  return s.length > n ? s.slice(0, n) + "…[truncated]" : s;
}

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const wantsForm = opts.body instanceof FormData;

  const headers: HeadersInit = {
    ...(wantsForm ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const url = `${API}${path}`;
  console.debug("[req] →", opts.method ?? "GET", url, { headers });

  const res = await fetch(url, {
    mode: "cors",
    credentials: "omit",
    ...opts,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  console.debug("[req] ←", res.status, contentType, preview(text));

  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      if (j?.detail) throw new Error(`${res.status} ${j.detail}`);
      if (j) throw new Error(`${res.status} ${JSON.stringify(j)}`);
      throw new Error(`${res.status} ${preview(text)}`);
    } catch (e) {
      if (e instanceof SyntaxError)
        throw new Error(`${res.status} ${preview(text)}`);
      throw e;
    }
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    console.debug("[req] non-JSON response body returned as text");
    return text as unknown as any;
  }
}

// ---------- API helpers ----------
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

export const uploadAvatar = (token: string, profileId: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return req(
    `/profiles/${profileId}/avatar/`,
    { method: "POST", body: fd },
    token
  );
};

// Day entries
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

export const upsertEntry = (
  token: string,
  profileId: number,
  dateISO: string,
  note?: string
) =>
  req(
    `/profiles/${profileId}/entries/`,
    { method: "POST", body: JSON.stringify({ date: dateISO, note }) },
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
