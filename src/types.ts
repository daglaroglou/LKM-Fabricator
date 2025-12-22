export type PatcherType = 'kernelsu' | 'kernelsu-next' | 'sukisu' | 'apatch';

export type ImageSourceType = 'file' | 'url';

export interface PatchRequest {
  sourceType: ImageSourceType;
  file?: File;
  imageUrl?: string;
  patcherType: PatcherType;
  githubToken: string;
}

export interface WorkflowRun {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled';
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowJob {
  id: number;
  status: string;
  conclusion?: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion?: string;
    number: number;
  }>;
}

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  created_at: string;
}
