// export const API = "http://localhost:8000/api";

// async function req(path: string, opts: RequestInit = {}, token?: string) {
//   const isFormData = opts.body instanceof FormData;

//   const headers: HeadersInit = {
//     ...(isFormData ? {} : { "Content-Type": "application/json" }),
//     Accept: "application/json",
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     ...(opts.headers || {}),
//   };

//   const res = await fetch(`${API}${path}`, {
//     mode: "cors",
//     credentials: "omit",
//     ...opts,
//     headers,
//   });

//   const text = await res.text();

//   if (!res.ok) {
//     try {
//       const j = text ? JSON.parse(text) : null;
//       throw new Error(j?.detail || `Error ${res.status}`);
//     } catch (e) {
//       if (e instanceof SyntaxError) throw new Error(`Error ${res.status}`);
//       throw e;
//     }
//   }

//   return text ? JSON.parse(text) : null;
// }

// // Auth
// export async function register(username: string, password: string) {
//   return req("/register/", {
//     method: "POST",
//     body: JSON.stringify({ username, password }),
//   });
// }

// export async function login(username: string, password: string) {
//   const json = await req("/token/", {
//     method: "POST",
//     body: JSON.stringify({ username, password }),
//   });
//   return json.access as string;
// }

// // Profiles
// export const getProfiles = (token: string) => req("/profiles/", {}, token);

// export const createProfile = (
//   token: string,
//   name: string,
//   is_default = false
// ) =>
//   req(
//     "/profiles/",
//     { method: "POST", body: JSON.stringify({ name, is_default }) },
//     token
//   );

// export const uploadAvatar = (token: string, profileId: number, file: File) => {
//   const fd = new FormData();
//   fd.append("file", file);
//   return req(
//     `/profiles/${profileId}/avatar/`,
//     { method: "POST", body: fd },
//     token
//   );
// };

// // Entries
// export const getEntry = (token: string, profileId: number, dateISO: string) =>
//   req(
//     `/profiles/${profileId}/entries/?date=${encodeURIComponent(dateISO)}`,
//     {},
//     token
//   );

// export const upsertEntry = (
//   token: string,
//   profileId: number,
//   dateISO: string,
//   note?: string
// ) =>
//   req(
//     `/profiles/${profileId}/entries/`,
//     { method: "POST", body: JSON.stringify({ date: dateISO, note }) },
//     token
//   );

// export const listDates = (token: string, profileId: number, limit = 30) =>
//   req(`/profiles/${profileId}/entries/dates/?limit=${limit}`, {}, token);

// export const uploadPhoto = (
//   token: string,
//   profileId: number,
//   entryId: number,
//   file: File
// ) => {
//   const fd = new FormData();
//   fd.append("file", file);
//   return req(
//     `/profiles/${profileId}/entries/${entryId}/upload/`,
//     { method: "POST", body: fd },
//     token
//   );
// };

// export const generateSummary = (
//   token: string,
//   profileId: number,
//   entryId: number,
//   style: "short" | "cheerful" | "nostalgic" = "short"
// ) =>
//   req(
//     `/profiles/${profileId}/entries/${entryId}/summary/`,
//     { method: "POST", body: JSON.stringify({ style }) },
//     token
//   );
export const API = "http://localhost:8000/api";

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const isFormData = opts.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(`${API}${path}`, {
    mode: "cors",
    credentials: "omit",
    ...opts,
    headers,
  });

  const text = await res.text();

  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(j?.detail || `Error ${res.status}`);
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(`Error ${res.status}`);
      throw e;
    }
  }

  return text ? JSON.parse(text) : null;
}

// Auth
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

export const deleteProfile = (token: string, profileId: number) =>
  req(`/profiles/${profileId}/`, { method: "DELETE" }, token);

export const uploadAvatar = (token: string, profileId: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return req(
    `/profiles/${profileId}/avatar/`,
    { method: "POST", body: fd },
    token
  );
};

// Entries
export const getEntry = (token: string, profileId: number, dateISO: string) =>
  req(
    `/profiles/${profileId}/entries/?date=${encodeURIComponent(dateISO)}`,
    {},
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
