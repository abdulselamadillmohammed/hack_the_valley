import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Conv = { id: number; last?: string };
type UserRow = { id: number; username: string };

export default function Conversations() {
  const [token, setToken] = useState<string | null>(null);
  const [list, setList] = useState<Conv[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem("access").then(setToken);
  }, []);
  async function loadConvos() {
    if (!token) return;
    try {
      setList(await api("/conversations/", "GET", null, token));
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }
  useEffect(() => {
    loadConvos();
  }, [token]);

  async function search() {
    if (!token || !q.trim()) {
      setResults([]);
      return;
    }
    try {
      setResults(
        await api(
          `/users/search/?q=${encodeURIComponent(q.trim())}`,
          "GET",
          null,
          token
        )
      );
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }

  async function follow(userId: number) {
    if (!token) return;
    try {
      await api("/users/follow/", "POST", { user_id: userId }, token);
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }

  async function unfollow(userId: number) {
    if (!token) return;
    try {
      await api(`/users/follow/${userId}/`, "DELETE", null, token);
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }

  async function connectAndChat(userId: number) {
    if (!token) return;
    try {
      const data = await api(
        "/conversations/create/",
        "POST",
        { participant_user_id: userId },
        token
      );
      router.push(`/(tabs)/chat/${data.id}`);
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.h}>Conversations</Text>

      <FlatList
        data={list}
        keyExtractor={(it) => String(it.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push(`/(tabs)/chat/${item.id}`)}
          >
            <Text style={s.t}>Conversation #{item.id}</Text>
            <Text numberOfLines={1} style={s.sub}>
              {item.last || "No messages"}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />

      <Text style={s.h2}>Find people</Text>
      <View style={s.searchRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="Search username prefix…"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
        />
        <Button title="Search" onPress={search} />
      </View>

      <FlatList
        data={results}
        keyExtractor={(u) => String(u.id)}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        renderItem={({ item }) => (
          <View style={s.userRow}>
            <Text style={{ fontWeight: "600" }}>@{item.username}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Follow" onPress={() => follow(item.id)} />
              <Button
                title="Unfollow"
                color="#b55"
                onPress={() => unfollow(item.id)}
              />
              <Button title="Message" onPress={() => connectAndChat(item.id)} />
            </View>
          </View>
        )}
      />

      {msg ? <Text style={{ color: "#b33" }}>{msg}</Text> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 12 },
  h: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  row: { padding: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 10 },
  t: { fontWeight: "600" },
  sub: { color: "#666", marginTop: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  userRow: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
