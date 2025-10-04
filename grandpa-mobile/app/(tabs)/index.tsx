// app/(tabs)/index.tsx
import { Redirect } from "expo-router";
export default function TabsHome() {
  return <Redirect href="/(tabs)/conversations" />;
}
