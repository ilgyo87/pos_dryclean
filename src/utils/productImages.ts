// src/utils/productImages.ts
import { ImageSourcePropType } from 'react-native';

// Create a mapping of all available image assets
const imageAssets: Record<string, ImageSourcePropType> = {
  // Define all images from assets/items folder
  'blazer': require('../../assets/items/blazer.png'),
  'blanket': require('../../assets/items/blanket.png'),
  'box_clothes': require('../../assets/items/box_clothes.png'),
  'curtain': require('../../assets/items/curtain.png'),
  'dress': require('../../assets/items/dress.png'),
  'dress-shirt': require('../../assets/items/dress-shirt.png'),
  'groom-suit': require('../../assets/items/groom-suit.png'),
  'hem_cut': require('../../assets/items/hem_cut.png'),
  'jacket': require('../../assets/items/jacket.png'),
  'jeans': require('../../assets/items/jeans.png'),
  'jersey': require('../../assets/items/jersey.png'),
  'kids_clothes': require('../../assets/items/kids_clothes.png'),
  'leather-jacket': require('../../assets/items/leather-jacket.png'),
  'pillow': require('../../assets/items/pillow.png'),
  'polo': require('../../assets/items/polo.png'),
  'rug': require('../../assets/items/rug.png'),
  'sari': require('../../assets/items/sari.png'),
  'shoes': require('../../assets/items/shoes.png'),
  'skirt': require('../../assets/items/skirt.png'),
  'socks': require('../../assets/items/socks.png'),
  'towel': require('../../assets/items/towel.png'),
  'trousers': require('../../assets/items/trousers.png'),
  'tshirt': require('../../assets/items/tshirt.png'),
  'waist': require('../../assets/items/waist.png'),
  'woman_suit': require('../../assets/items/woman_suit.png'),
  'winter_coat': require('../../assets/items/winter_coat.png'),
  'winter-hat': require('../../assets/items/winter-hat.png'),
  'wedding-dress': require('../../assets/items/wedding-dress.png'),
  'zipper': require('../../assets/items/zipper.png'),
  // Add any placeholder for missing images
  'placeholder': require('../../assets/items/tshirt.png')
};

// Helper function to get image source that supports both remote URLs and local assets
export const getImageSource = (imageUrl?: string | null, imageSource?: string | null) => {
  // First priority: Check if we have a remote URL (imageUrl field)
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return { uri: imageUrl };
  }
  
  // Second priority: Check if we have an imageSource to map to a local asset
  if (imageSource) {
    // Normalize the imageSource name (replace hyphens with underscores)
    const normalizedName = imageSource.toLowerCase();
    
    // Direct match in our assets
    if (imageAssets[normalizedName]) {
      return imageAssets[normalizedName];
    }
  }
  
  // Default fallback
  return imageAssets['placeholder'];
};

// Function to get all available image names (useful for image pickers)
export const getAssetImageNames = (): string[] => {
  return Object.keys(imageAssets).filter(name => name !== 'placeholder');
};