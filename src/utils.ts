export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function saveTokenToStorage(token: string) {
  localStorage.setItem('github_token', token);
}

export function getTokenFromStorage(): string | null {
  return localStorage.getItem('github_token');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Uploads a file to filebin.net and returns the download URL
 * @param file The file to upload
 * @returns The public download URL for the uploaded file
 */
export async function uploadToFilebin(file: File): Promise<string> {
  try {
    // Generate a random bin ID
    const binId = `lkm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName = file.name;

    // Upload to filebin.net
    const uploadUrl = `https://filebin.net/${binId}/${fileName}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload to filebin: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return the download URL
    return uploadUrl;
  } catch (error) {
    console.error('Error uploading to filebin:', error);
    throw new Error(`Failed to upload file to filebin: ${(error as Error).message}`);
  }
}
