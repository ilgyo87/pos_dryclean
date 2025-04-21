// src/components/Products/ImageMapper.ts

/**
 * This function safely loads an image from assets
 * It uses a try-catch to handle cases where the image doesn't exist
 */
export const getGarmentImage = (imageName: string) => {
    // Make sure the name is safe for require by cleaning it
    const cleanImageName = imageName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    
    try {
      // Try to dynamically load the image, falling back to a default
      // if it doesn't exist
      let image = null;
      
      // This looks verbose, but we need to handle each possible image explicitly
      // because require() in React Native needs static strings
      switch (cleanImageName) {
        case 'blankets':
          return require('../assets/garments/blankets.png');
        case 'blazer':
          return require('../assets/garments/blazer.png');
        case 'boxed-shirts':
          return require('../assets/garments/boxed-shirts.png');
        case 'buttons':
          return require('../assets/garments/buttons.png');
        case 'clothes-cut':
          return require('../assets/garments/clothes-cut.png');
        case 'comforter':
          return require('../assets/garments/comforter.png');
        case 'curtain':
          return require('../assets/garments/curtain.png');
        case 'dress-shirt':
          return require('../assets/garments/dress-shirt.png');
        case 'dress':
          return require('../assets/garments/dress.png');
        case 'hem':
          return require('../assets/garments/hem.png');
        case 'jacket':
          return require('../assets/garments/jacket.png');
        case 'jeans':
          return require('../assets/garments/jeans.png');
        case 'jersey':
          return require('../assets/garments/jersey.png');
        case 'kids-clothes':
          return require('../assets/garments/kids-clothes.png');
        case 'leather-jacket':
          return require('../assets/garments/leather-jacket.png');
        case 'pants':
          return require('../assets/garments/pants.png');
        case 'patch':
          return require('../assets/garments/patch.png');
        case 'pillow':
          return require('../assets/garments/pillow.png');
        case 'polo':
          return require('../assets/garments/polo.png');
        case 'rug':
          return require('../assets/garments/rug.png');
        case 'sari':
          return require('../assets/garments/sari.png');
        case 'sewing':
          return require('../assets/garments/sewing.png');
        case 'shirt-cut':
          return require('../assets/garments/shirt-cut.png');
        case 'shoes':
          return require('../assets/garments/shoes.png');
        case 'skirt':
          return require('../assets/garments/skirt.png');
        case 'socks':
          return require('../assets/garments/socks.png');
        case 'suit':
          return require('../assets/garments/suit.png');
        case 'take-in':
          return require('../assets/garments/take-in.png');
        case 'tshirt':
          return require('../assets/garments/tshirt.png');
        case 'waist':
          return require('../assets/garments/waist.png');
        case 'washing-clothes':
          return require('../assets/garments/washing-clothes.png');
        case 'wedding-dress':
          return require('../assets/garments/wedding-dress.png');
        case 'winter-coat':
          return require('../assets/garments/winter-coat.png');
        case 'winter-hat':
          return require('../assets/garments/winter-hat.png');
        case 'woman-suit':
          return require('../assets/garments/woman-suit.png');
        case 'zipper':
          return require('../assets/garments/zipper.png');
        case 'default':
        default:
          return require('../assets/garments/tshirt.png');
      }
    } catch (error) {
      // If image loading fails, return null to use a fallback
      console.log(`Failed to load image: ${imageName}`, error);
      return null;
    }
  };