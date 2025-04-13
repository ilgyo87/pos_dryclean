import { Authenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import AuthenticatedApp from './AuthenticatedApp';

Amplify.configure(outputs);

export default function App() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <AuthenticatedApp />
      </Authenticator>
    </Authenticator.Provider>
  );
}