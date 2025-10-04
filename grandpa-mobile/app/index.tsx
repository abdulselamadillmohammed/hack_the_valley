// app/index.tsx
import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [tok, setTok] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    AsyncStorage.getItem("access").then(setTok);
  }, []);
  if (tok === undefined) return null;
  return tok ? (
    <Redirect href="/(tabs)/conversations" />
  ) : (
    <Redirect href="/login" />
  );
}
