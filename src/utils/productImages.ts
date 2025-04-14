// Helper function to get image source that supports both remote URLs and local assets
export const getImageSource = (imageUrl?: string | null, imageSource?: string | null) => {
  // First priority: Check if we have a remote URL (imageUrl field)
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    console.log('Using remote URL:', imageUrl);
    return { uri: imageUrl };
  }
  
  // Second priority: Check if we have an imageSource to map to a local asset
  if (imageSource) {
    console.log('Loading local asset from imageSource:', imageSource);
    try {
      // Add .png extension to the imageSource
      const imagePath = `${imageSource}.png`;
      // Common mapping for image assets
      switch (imageSource) {
        // Shirts
        case 'dress-shirt':
        case 'dress_shirt':
          return require('../../assets/items/dress_shirt.png');

        // Pants & Bottoms
        case 'pants':
        case 'trousers':
          return require('../../assets/items/trousers.png');
        case 'jeans':
          return require('../../assets/items/jeans.png');
        case 'skirt':
          return require('../../assets/items/skirt.png');

        // Outerwear
        case 'jacket':
          return require('../../assets/items/jacket.png');
        case 'blazer':
          return require('../../assets/items/blazer.png');
        case 'winter_coat':
        case 'winter-coat':
          return require('../../assets/items/winter_coat.png');
        case 'leather-jacket':
          return require('../../assets/items/jacket.png'); // Fallback to regular jacket

        // Tops & Dresses
        case 'dress':
          return require('../../assets/items/dress.png');
        case 'polo':
          return require('../../assets/items/polo.png');
        case 'tshirt':
          return require('../../assets/items/tshirt.png');
        case 'jersey':
          return require('../../assets/items/tshirt.png'); // Fallback to t-shirt
        case 'sari':
          return require('../../assets/items/dress.png'); // Fallback to dress
        case 'wedding-dress':
          return require('../../assets/items/dress.png'); // Fallback to dress

        // Formal Wear
        case 'groom-suit':
          return require('../../assets/items/blazer.png'); // Fallback to blazer

        // Household Items
        case 'blanket':
          return require('../../assets/items/blanket.png');
        case 'curtain':
          return require('../../assets/items/curtain.png');
        case 'towel':
          return require('../../assets/items/blanket.png'); // Fallback to blanket
        case 'pillow':
          return require('../../assets/items/blanket.png'); // Fallback to blanket
        case 'rug':
          return require('../../assets/items/blanket.png'); // Fallback to blanket
        
        // Children's Items
        case 'kids_clothes':
        case 'kids-clothes':
          return require('../../assets/items/tshirt.png'); // Fallback to t-shirt

        // Other Services
        case 'box_clothes':
        case 'box-clothes':
          return require('../../assets/items/dress_shirt.png'); // Fallback to dress shirt
        case 'hem_cut':
        case 'hem-cut':
          return require('../../assets/items/trousers.png'); // Fallback to trousers
        case 'zipper':
          return require('../../assets/items/trousers.png'); // Fallback to trousers
        case 'waist':
          return require('../../assets/items/trousers.png'); // Fallback to trousers
        case 'shoes':
          return require('../../assets/items/tshirt.png'); // Fallback to generic item

        default:
          // If no direct match, try to check if it's one of our assets without extension matching
          console.log('No direct match for', imageSource, 'trying partial match');
          if (imageSource.includes('shirt')) {
            return require('../../assets/items/dress_shirt.png');
          } else if (imageSource.includes('pant') || imageSource.includes('trouser')) {
            return require('../../assets/items/trousers.png');
          } else if (imageSource.includes('jacket') || imageSource.includes('coat') || imageSource.includes('blazer')) {
            return require('../../assets/items/jacket.png');
          } else if (imageSource.includes('dress')) {
            return require('../../assets/items/dress.png');
          } else if (imageSource.includes('blanket') || imageSource.includes('comforter') || imageSource.includes('household')) {
            return require('../../assets/items/blanket.png');
          } else {
            // Default fallback if no match
            console.log('No match found for', imageSource);
            return null;
          }
      }
    } catch (error) {
      console.error('Error loading image from imageSource:', error);
      return null;
    }
  }
  
  // If neither imageUrl nor imageSource provided
  console.log('No image information provided');
  return null;
};
