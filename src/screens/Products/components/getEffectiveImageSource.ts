// Utility to always prefer imageUrl (S3) over imageSource (local)
import { getImageSource } from "../../../utils/productImages";

export function getEffectiveImageSource(imageSource?: string, imageUrl?: string) {
  if (imageUrl && imageUrl.trim() !== "") {
    return { uri: imageUrl.trim() };
  } else if (imageSource && imageSource !== "placeholder") {
    return getImageSource(imageSource);
  } else {
    return getImageSource("placeholder");
  }
}
