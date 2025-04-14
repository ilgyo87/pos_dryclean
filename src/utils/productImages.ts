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

// Function to get all available image names (useful for image pickers)
export const getAssetImageNames = (): string[] => {
  return Object.keys(imageAssets).filter(name => name !== 'placeholder');
};

// Helper function to get image source that supports both remote URLs and local assets
export const getImageSource = (imageSourceOrUrl?: string | null, fallbackSource?: string | null) => {
  console.log('getImageSource called with:', imageSourceOrUrl, fallbackSource);
  
  // First check if it's a URL
  if (imageSourceOrUrl && (imageSourceOrUrl.startsWith('http://') || imageSourceOrUrl.startsWith('https://'))) {
    console.log('Using URL:', imageSourceOrUrl);
    return { uri: imageSourceOrUrl };
  }
  
  // Then check if it's a valid image asset name
  if (imageSourceOrUrl) {
    const normalizedName = imageSourceOrUrl.toLowerCase();
    if (imageAssets[normalizedName]) {
      console.log('Found matching asset for:', normalizedName);
      return imageAssets[normalizedName];
    }
    console.log('No matching asset found for:', normalizedName);
  }
  
  // Try fallback if provided
  if (fallbackSource && imageAssets[fallbackSource.toLowerCase()]) {
    console.log('Using fallback source:', fallbackSource);
    return imageAssets[fallbackSource.toLowerCase()];
  }
  
  // Default fallback
  console.log('Using default placeholder');
  return imageAssets['placeholder'];
};