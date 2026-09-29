import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
export async function selectAudioFiles(): Promise<{uri: string; name: string}[]> {
  try {
    const files = await pick({type: [types.audio], allowMultiSelection: true});
    return files.map(file => ({uri: file.uri, name: file.name ?? 'Audio'}));
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return [];
    }
    throw error;
  }
}
