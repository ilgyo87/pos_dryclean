import { defineStorage } from '@aws-amplify/backend';

// Define your storage resource
export const storage = defineStorage({
  name: 'posdrycleaningstorage', // Custom bucket name
  access: (allow) => ({
    // QR codes organized by identity ID
    'qrcodes/{entity_id}/*': [
      allow.authenticated.to(['read']), // All authenticated users can read QR codes
      allow.entity('identity').to(['read', 'write', 'delete']) // Entity owners can manage their QR codes
    ],
    // Public business images (logos, banners)
    'public/*': [
      allow.guest.to(['read']), // Anyone can view public images
      allow.authenticated.to(['read', 'write']) // Authenticated users can read/write to public folder
    ],
    // Private images organized by identity ID
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']) // Only entity owners can manage their images
    ]
  })
});