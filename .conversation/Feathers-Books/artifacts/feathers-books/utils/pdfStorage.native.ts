export async function storePdfFile(_file: Blob): Promise<string> {
  throw new Error('Persistent web PDF storage is not available on native.');
}

export async function readPdfFile(_uri: string): Promise<Blob | null> {
  return null;
}