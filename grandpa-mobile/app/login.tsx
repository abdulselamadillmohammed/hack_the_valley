import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { login } from "../hooks/useAuth";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function onSubmit() {
    try {
      await login(u, p);
      router.replace("/(tabs)/conversations");
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.h}>Login</Text>
      <TextInput
        style={s.i}
        placeholder="username"
        autoCapitalize="none"
        value={u}
        onChangeText={setU}
      />
      <TextInput
        style={s.i}
        placeholder="password"
        secureTextEntry
        value={p}
        onChangeText={setP}
      />
      <Button title="Login" onPress={onSubmit} />
      <View style={{ height: 12 }} />
      <Link href="/register">No account? Register</Link>
      {msg ? <Text style={s.e}>{msg}</Text> : null}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 12 },
  h: { fontSize: 24, fontWeight: "700" },
  i: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  e: { color: "#b33" },
});
