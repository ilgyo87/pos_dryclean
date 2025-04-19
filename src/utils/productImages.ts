// src/utils/productImages.ts
import { ImageSourcePropType } from "react-native";

// Create a mapping of all available image assets
const imageAssets: Record<string, ImageSourcePropType> = {
  "blanket": require("../../assets/items/blanket.png"),
  "blazer": require("../../assets/items/blazer.png"),
  "box_clothes": require("../../assets/items/box_clothes.png"),
  "curtain": require("../../assets/items/curtain.png"),
  "dress-shirt": require("../../assets/items/dress-shirt.png"),
  "dress": require("../../assets/items/dress.png"),
  "groom-suit": require("../../assets/items/groom-suit.png"),
  "hem_cut": require("../../assets/items/hem_cut.png"),
  "jacket": require("../../assets/items/jacket.png"),
  "jeans": require("../../assets/items/jeans.png"),
  "jersey": require("../../assets/items/jersey.png"),
  "kids_clothes": require("../../assets/items/kids_clothes.png"),
  "leather-jacket": require("../../assets/items/leather-jacket.png"),
  "pillow": require("../../assets/items/pillow.png"),
  "polo": require("../../assets/items/polo.png"),
  "rug": require("../../assets/items/rug.png"),
  "sari": require("../../assets/items/sari.png"),
  "shoes": require("../../assets/items/shoes.png"),
  "skirt": require("../../assets/items/skirt.png"),
  "socks": require("../../assets/items/socks.png"),
  "towel": require("../../assets/items/towel.png"),
  "trousers": require("../../assets/items/trousers.png"),
  "tshirt": require("../../assets/items/tshirt.png"),
  "waist": require("../../assets/items/waist.png"),
  "washing-clothes": require("../../assets/items/washing-clothes.png"),
  "wedding-dress": require("../../assets/items/wedding-dress.png"),
  "winter-hat": require("../../assets/items/winter-hat.png"),
  "winter_coat": require("../../assets/items/winter_coat.png"),
  "woman_suit": require("../../assets/items/woman_suit.png"),
  "zipper": require("../../assets/items/zipper.png")
};

// Function to get all available image names (useful for image pickers)
export const getAssetImageNames = (): string[] => {
  return Object.keys(imageAssets).filter(name => name !== "placeholder");
};

// Helper function to get image source that supports both remote URLs and local assets
export const getImageSource = (imageSourceOrUrl?: string | null) => {
  // First check if it's a URL
  if (imageSourceOrUrl && (imageSourceOrUrl.startsWith("http://") || imageSourceOrUrl.startsWith("https://"))) {
    return { uri: imageSourceOrUrl };
  }
  if (imageSourceOrUrl) {
    const original = imageSourceOrUrl.trim().toLowerCase();
    const dashToUnderscore = original.replace(/-/g, "_");
    const underscoreToDash = original.replace(/_/g, "-");
    const possibleKeys = [original, dashToUnderscore, underscoreToDash];
    for (const key of possibleKeys) {
      if (imageAssets[key]) {
        return imageAssets[key];
      }
    }
  }
  // Always fallback to tshirt
  return imageAssets["tshirt"];
};