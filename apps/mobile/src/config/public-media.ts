// Expo replaces direct EXPO_PUBLIC references at build time. Never add private keys here.
export const publicMedia = {
  imageKitEndpoint: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim(),
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim(),
};
