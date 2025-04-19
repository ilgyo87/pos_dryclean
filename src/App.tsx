import { Authenticator } from "@aws-amplify/ui-react-native";
import { Amplify } from "aws-amplify";
import { Provider } from "react-redux";
import { store } from "./store";
import outputs from "../amplify_outputs.json";
import AuthenticatedApp from "./AuthenticatedApp";

Amplify.configure(outputs);

export default function App() {
  return (
    <Provider store={store}>
      <Authenticator.Provider>
        <Authenticator>
          <AuthenticatedApp />
        </Authenticator>
      </Authenticator.Provider>
    </Provider>
  );
}