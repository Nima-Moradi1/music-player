import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
export async function selectAudioFiles(): Promise<{uri: string; name: string}[]> {
  try {
    // Some document providers label FLAC/M4A as generic binary. The native
    // inspection step still rejects unsupported or corrupt files after selection.
    const files = await pick({type: [types.allFiles], allowMultiSelection: true});
    return files.map(file => ({uri: file.uri, name: file.name ?? 'Audio'}));
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return [];
    }
    throw error;
  }
}
