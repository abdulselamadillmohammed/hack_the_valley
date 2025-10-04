export const getToken = () => localStorage.getItem("access");
export const setToken = (t: string) => localStorage.setItem("access", t);
export const clearToken = () => localStorage.removeItem("access");
