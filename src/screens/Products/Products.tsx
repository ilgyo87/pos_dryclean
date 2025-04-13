import { View, Text } from "react-native";
import { AuthUser } from "aws-amplify/auth";

export default function Products({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
    return (
        <View>
            <Text>Products</Text>
        </View>
    );
}