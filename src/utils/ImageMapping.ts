// src/components/Products/ImageMapper.ts

/**
 * This function safely loads an image from assets
 * It uses a try-catch to handle cases where the image doesn't exist
 */
const images: Record<string, any> = {
  blankets: require('../../assets/garments/blankets.png'),
  blazer: require('../../assets/garments/blazer.png'),
  'boxed-shirts': require('../../assets/garments/boxed-shirts.png'),
  buttons: require('../../assets/garments/buttons.png'),
  'clothes-cut': require('../../assets/garments/clothes-cut.png'),
  comforter: require('../../assets/garments/comforter.png'),
  curtain: require('../../assets/garments/curtain.png'),
  'dress-shirt': require('../../assets/garments/dress-shirt.png'),
  dress: require('../../assets/garments/dress.png'),
  hem: require('../../assets/garments/hem.png'),
  jacket: require('../../assets/garments/jacket.png'),
  jeans: require('../../assets/garments/jeans.png'),
  jersey: require('../../assets/garments/jersey.png'),
  'kids-clothes': require('../../assets/garments/kids-clothes.png'),
  'leather-jacket': require('../../assets/garments/leather-jacket.png'),
  pants: require('../../assets/garments/pants.png'),
  patch: require('../../assets/garments/patch.png'),
  pillow: require('../../assets/garments/pillow.png'),
  polo: require('../../assets/garments/polo.png'),
  rug: require('../../assets/garments/rug.png'),
  sari: require('../../assets/garments/sari.png'),
  sewing: require('../../assets/garments/sewing.png'),
  'shirt-cut': require('../../assets/garments/shirt-cut.png'),
  shoes: require('../../assets/garments/shoes.png'),
  skirt: require('../../assets/garments/skirt.png'),
  socks: require('../../assets/garments/socks.png'),
  suit: require('../../assets/garments/suit.png'),
  'take-in': require('../../assets/garments/take-in.png'),
  tshirt: require('../../assets/garments/tshirt.png'),
  't-shirt': require('../../assets/garments/t-shirt.png'),
  waist: require('../../assets/garments/waist.png'),
  'washing-clothes': require('../../assets/garments/washing-clothes.png'),
  'wedding-dress': require('../../assets/garments/wedding-dress.png'),
  'winter-coat': require('../../assets/garments/winter-coat.png'),
  'winter-hat': require('../../assets/garments/winter-hat.png'),
  'woman-suit': require('../../assets/garments/woman-suit.png'),
  zipper: require('../../assets/garments/zipper.png'),
  default: require('../../assets/garments/t-shirt.png'),
};

export const getGarmentImage = (imageName: string) => {
  try {
    if (!imageName || typeof imageName !== 'string') return images.default;
    // Normalize: lowercase, replace spaces/underscores with dashes, strip non-alphanum/dash
    const cleanImageName = imageName
      .toLowerCase()
      .replace(/[\s_]+/g, '-')        // spaces/underscores to dashes
      .replace(/[^a-z0-9-]/g, '');    // remove all but alphanum and dash
    return images[cleanImageName] || images.default;
  } catch (error) {
    // If image loading fails, return null to use a fallback
    console.log(`Failed to load image: ${imageName}`, error);
    return null;
  }
}