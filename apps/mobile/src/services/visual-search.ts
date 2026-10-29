import * as ImagePicker from 'expo-image-picker';
import {Platform} from 'react-native';
export interface VisualSearchPhoto { uri: string; width: number; height: number }
export interface VisualSearchProvider { readonly configured: boolean; findSimilar(photo: VisualSearchPhoto): Promise<{productId:string;score:number}[]> }
/** No descriptors/recognition engine exists. Never infer matches from a filename or title. */
export const visualSearchProvider: VisualSearchProvider = {configured:false,findSimilar:async()=>{throw new Error('Image matching is not configured. Your photo has not been uploaded. Use text search or browse a category.');}};
export async function pickSearchPhoto(source:'camera'|'gallery'):Promise<VisualSearchPhoto|null> {
  if(Platform.OS!=='web'&&source==='camera') {
    const access=await ImagePicker.requestCameraPermissionsAsync();
    if(!access.granted)throw new Error('Camera permission was declined. Choose a gallery image or use text search.');
  }
  const options:ImagePicker.ImagePickerOptions={mediaTypes:['images'],quality:.75,exif:false,base64:false,allowsEditing:false,allowsMultipleSelection:false};
  // On web this remains directly within the user's click activation.
  const result=source==='camera'?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
  if(result.canceled)return null;
  const asset=result.assets[0];
  if(!asset||asset.fileSize&&asset.fileSize>5*1024*1024)throw new Error('Choose an image smaller than 5 MB.');
  if(!/^(file:|content:|blob:|data:image\/)/i.test(asset.uri))throw new Error('Choose an image stored on this device. Remote image links are not opened.');
  return {uri:asset.uri,width:asset.width,height:asset.height};
}
