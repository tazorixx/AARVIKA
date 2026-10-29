import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { MediaAsset } from '../domain/contracts';
import { imageMime } from '../domain/personalization';
export async function selectLocalPhoto(ownerId: string): Promise<MediaAsset | null> {
  if (Platform.OS !== 'web') { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) throw new Error('Photo access was declined. You can continue without a photo or allow access in device settings.'); }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, base64: true, quality: 0.8, exif: false });
  if (result.canceled) return null;
  const asset = result.assets[0]; const base64 = asset.base64; if (!base64) throw new Error('Could not read this photo. Choose a JPEG, PNG or WebP.');
  const mimeType = imageMime(base64); if (!mimeType) throw new Error('Unsupported photo contents. Choose a JPEG, PNG or WebP.');
  const bytes = Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0); if (bytes > 5 * 1024 * 1024) throw new Error('Photo must be no larger than 5 MB.');
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let uri = `data:${mimeType};base64,${base64}`;
  if (Platform.OS !== 'web') { const { File, Directory, Paths } = await import('expo-file-system'); const directory = new Directory(Paths.document, 'aarvika-demo-media'); directory.create({ intermediates: true, idempotent: true }); const destination = new File(directory, `${id}.${mimeType.split('/')[1]}`); await new File(asset.uri).copy(destination); uri = destination.uri; }
  return { id, uri, mimeType, bytes, ownerId, localOnly: true };
}
export async function clearLocalPhotos() { if (Platform.OS !== 'web') { const { Directory, Paths } = await import('expo-file-system'); const directory = new Directory(Paths.document, 'aarvika-demo-media'); if (directory.exists) directory.delete(); } }
