import { Button, View } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

export default function SignOutButton() {
  const { signOut } = useAuthenticator();
  return (
    <View style={{ position: "absolute", top: 10, right: 0, zIndex: 10 }}>
      <Button title="SIGN OUT" onPress={signOut} color="#FF0000" />
    </View>
  );
}