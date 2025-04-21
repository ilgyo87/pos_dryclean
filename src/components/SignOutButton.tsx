import { Button, View } from "react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

export default function SignOutButton() {
  const { signOut } = useAuthenticator();
  return (
    <View style={{ position: 'absolute', top: 23, right: 10, zIndex: 10 }}>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}