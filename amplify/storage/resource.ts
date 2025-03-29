import { defineStorage } from '@aws-amplify/backend';

// Define your storage resource
export const storage = defineStorage({
  name: 'posdrycleaningstorage', // Custom bucket name
  access: (allow) => ({
    // QR codes organized by business ID
    'qrcodes/*': [
      allow.authenticated.to(['read', 'write', 'delete']), // All authenticated users can manage QR codes
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