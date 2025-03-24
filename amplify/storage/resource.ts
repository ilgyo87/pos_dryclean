// amplify/storage/resource.ts
import { defineStorage } from '@aws-amplify/backend';

// QR codes storage bucket
export const qrCodeStorage = defineStorage({
  name: 'drycleanStorage',
  isDefault: true, // Mark as default bucket
  access: (allow) => ({
    // QR codes organized by owner ID
    'qrcodes/{entity_id}/*': [
      allow.authenticated.to(['read']), // All authenticated users can read QR codes
      allow.entity('identity').to(['read', 'write', 'delete']) // Owners can manage their QR codes
    ]
  })
});

// Images storage bucket (for product, customer, employee images)
export const imageStorage = defineStorage({
  name: 'drycleanImages',
  access: (allow) => ({
    // Public business images (logos, banners)
    'public/*': [
      allow.guest.to(['read']), // Anyone can view public images
      allow.authenticated.to(['read', 'write']) // Authenticated users can read/write to public folder
    ],
    // Private images organized by owner ID
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']) // Only owners can manage their images
    ],
    // Protected images (accessible to all authenticated users)
    'protected/*': [
      allow.authenticated.to(['read']), // All authenticated users can read
      allow.entity('identity').to(['read', 'write', 'delete']) // Only owners can manage
    ]
  })
});