import { registerRootComponent } from 'expo';
import { Buffer as BufferPolyfill } from 'buffer';

// Set global Buffer for any libraries that might need it
global.Buffer = BufferPolyfill;

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);