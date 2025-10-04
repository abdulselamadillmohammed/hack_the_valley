import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../constants/config";

export async function register(username: string, password: string) {
  return api("/register/", "POST", { username, password });
}

export async function login(username: string, password: string) {
  const data = await api("/token/", "POST", { username, password });
  const access = data.access as string;
  await AsyncStorage.setItem("access", access);
  return access;
}

export async function getToken() {
  return AsyncStorage.getItem("access");
}

export async function logout() {
  await AsyncStorage.removeItem("access");
}
