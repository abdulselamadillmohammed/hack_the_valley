// token helpers
export const getToken = () => localStorage.getItem("access");
export const setToken = (t: string) => localStorage.setItem("access", t);
export const clearToken = () => localStorage.removeItem("access");

// active profile selection (no id in URL)
const ACTIVE_KEY = "activeProfileId";
export const getActiveProfileId = (): number | null => {
  const v = localStorage.getItem(ACTIVE_KEY);
  return v ? Number(v) : null;
};
export const setActiveProfileId = (id: number | null) => {
  if (id == null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, String(id));
};
