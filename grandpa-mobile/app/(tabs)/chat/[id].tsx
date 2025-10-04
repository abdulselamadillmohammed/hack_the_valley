import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, WS } from "../../../constants/config";
import { getToken } from "../../../hooks/useAuth";

type Msg = {
  id: number;
  conversation_id: number;
  sender_id: number;
  kind: string;
  text: string;
  attachment_url?: string | null;
  created_at: string;
};

function useChatSocket(
  conversationId: number,
  token: string | null,
  onServer: (evt: any) => void
) {
  const [ready, setReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const qRef = useRef<any[]>([]);
  const backoffRef = useRef(500);

  useEffect(() => {
    if (!token) return;
    let closed = false;
    const url = `${WS}/ws/chat/${conversationId}/?token=${encodeURIComponent(
      token
    )}`;

    function connect() {
      setReady(false);
      const ws = new WebSocket(url);
      ws.onopen = () => {
        wsRef.current = ws;
        setReady(true);
        backoffRef.current = 500;
        qRef.current.forEach((m) => ws.send(JSON.stringify(m)));
        qRef.current = [];
      };
      ws.onmessage = (ev) => {
        try {
          onServer(JSON.parse(ev.data));
        } catch {}
      };
      ws.onclose = () => {
        setReady(false);
        wsRef.current = null;
        if (closed) return;
        const wait = Math.min(backoffRef.current, 4000);
        setTimeout(connect, wait);
        backoffRef.current = Math.min(backoffRef.current * 2, 4000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    }

    connect();
    return () => {
      closed = true;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [conversationId, token]);

  function send(payload: any) {
    if (wsRef.current && ready) wsRef.current.send(JSON.stringify(payload));
    else qRef.current.push(payload);
  }

  return { ready, send };
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convoId = Number(id);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getToken().then(setToken);
  }, []);
  useEffect(() => {
    if (!token) return;
    api(`/messages/${convoId}/`, "GET", null, token)
      .then((data) => setMessages(data as Msg[]))
      .catch((e) => setMsg(String(e)));
  }, [token, convoId]);

  const { ready, send } = useChatSocket(convoId, token, (evt) => {
    if (evt?.type === "message" && evt.message) {
      setMessages((m) => [...m, evt.message as Msg]);
    }
  });

  async function sendText() {
    const body = text.trim();
    if (!body || !token) return;
    setText("");
    if (ready) send({ type: "send", kind: "text", text: body });
    else {
      try {
        await api(
          "/messages/send/",
          "POST",
          { conversation_id: convoId, text: body },
          token
        );
      } catch (e: any) {
        setMsg(String(e.message || e));
      }
    }
  }

  return (
    <SafeAreaView style={s.c}>
      <Text style={s.h}>Chat #{convoId}</Text>
      <Text style={{ color: ready ? "green" : "orange" }}>
        {ready ? "Connected" : "Reconnecting…"}
      </Text>
      <FlatList
        style={{ flex: 1, alignSelf: "stretch" }}
        contentContainerStyle={{ padding: 12 }}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <View style={[s.b, item.kind === "ai_draft" ? s.d : null]}>
            <Text>{item.text || (item.attachment_url ? "[image]" : "")}</Text>
          </View>
        )}
      />
      <View style={s.row}>
        <TextInput
          style={[s.i, { flex: 1 }]}
          placeholder="Type…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={sendText}
          returnKeyType="send"
        />
        <Button title="Send" onPress={sendText} />
      </View>
      <Button title="Back" onPress={() => router.back()} />
      {msg ? <Text style={{ color: "#b33" }}>{msg}</Text> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 16, gap: 8 },
  h: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  i: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  b: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    marginBottom: 8,
  },
  d: { backgroundColor: "#e7f0ff" },
});
