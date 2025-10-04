import { View, Text, Button, SafeAreaView } from "react-native";
import { logout } from "../../hooks/useAuth";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Profile</Text>
      <Button
        title="Logout"
        color="#b33"
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      />
    </SafeAreaView>
  );
}
