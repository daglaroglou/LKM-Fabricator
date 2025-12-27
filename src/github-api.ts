import { Octokit } from 'octokit';
import { WorkflowRun, WorkflowJob, Artifact, PatcherType } from './types';

// GitHub repository configuration
const REPO_OWNER = 'daglaroglou';
const REPO_NAME = 'LKM-Fabricator';
const DEFAULT_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

export class GitHubAPI {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private token: string;

  constructor(token: string = DEFAULT_TOKEN, owner: string = REPO_OWNER, repo: string = REPO_NAME) {
    this.token = token || DEFAULT_TOKEN;
    this.octokit = new Octokit({ auth: this.token });
    this.owner = owner;
    this.repo = repo;
  }
  
  static getDefaultToken(): string {
    return DEFAULT_TOKEN;
  }
  
  static getRepoInfo(): { owner: string; repo: string } {
    return { owner: REPO_OWNER, repo: REPO_NAME };
  }

  async triggerWorkflow(
    patcherType: PatcherType,
    imageUrl?: string,
    // imageBase64?: string
  ): Promise<number> {
    const workflowFile = this.getWorkflowFile(patcherType);
    
    // Check total input size (GitHub limit is 65,535 characters for all inputs combined)
    const inputs = {
      image_url: imageUrl || '',
      // image_base64: imageBase64 || '',
      patcher_type: patcherType,
    };
    
    const totalSize = Object.values(inputs).reduce((sum, val) => sum + val.length, 0);
    const MAX_INPUT_SIZE = 65535;
    
    if (totalSize > MAX_INPUT_SIZE) {
      throw new Error(
        `Inputs are too large (${totalSize.toLocaleString()} characters). ` +
        `GitHub workflow dispatch has a limit of ${MAX_INPUT_SIZE.toLocaleString()} characters for all inputs combined. ` +
        `Please use a URL instead of uploading the file directly, or use a smaller file.`
      );
    }
    
    try {
      // Trigger workflow
      await this.octokit.rest.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowFile,
        ref: 'main',
        inputs,
      });

      // Wait a bit for the workflow to be created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the latest workflow run
      const { data } = await this.octokit.rest.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowFile,
        per_page: 1,
      });

      if (data.workflow_runs.length === 0) {
        throw new Error('Workflow run not found');
      }

      return data.workflow_runs[0].id;
    } catch (error) {
      console.error('Error triggering workflow:', error);
      throw error;
    }
  }

  async getWorkflowRun(runId: number): Promise<WorkflowRun> {
    const { data } = await this.octokit.rest.actions.getWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    return data as WorkflowRun;
  }

  async getWorkflowJobs(runId: number): Promise<WorkflowJob[]> {
    const { data } = await this.octokit.rest.actions.listJobsForWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    return data.jobs as WorkflowJob[];
  }

  async getWorkflowLogs(runId: number): Promise<string> {
    try {
      const jobs = await this.getWorkflowJobs(runId);
      
      if (jobs.length === 0) {
        return 'Waiting for job to start...';
      }

      let logs = '';
      for (const job of jobs) {
        logs += `\n=== Job: ${job.id} ===\n`;
        logs += `Status: ${job.status}\n`;
        if (job.conclusion) {
          logs += `Conclusion: ${job.conclusion}\n`;
        }
        
        if (job.steps) {
          for (const step of job.steps) {
            logs += `\nStep ${step.number}: ${step.name}\n`;
            logs += `  Status: ${step.status}`;
            if (step.conclusion) {
              logs += ` | Conclusion: ${step.conclusion}`;
            }
            logs += '\n';
          }
        }
      }

      return logs || 'No logs available yet...';
    } catch (error) {
      console.error('Error fetching logs:', error);
      return 'Error fetching logs';
    }
  }

  async getArtifacts(runId: number): Promise<Artifact[]> {
    const { data } = await this.octokit.rest.actions.listWorkflowRunArtifacts({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    return data.artifacts as Artifact[];
  }

  async downloadArtifact(artifactId: number): Promise<ArrayBuffer> {
    const { data } = await this.octokit.rest.actions.downloadArtifact({
      owner: this.owner,
      repo: this.repo,
      artifact_id: artifactId,
      archive_format: 'zip',
    });

    return data as ArrayBuffer;
  }

  /**
   * Uploads a file to a temporary GitHub release and returns the download URL.
   * This works around GitHub's workflow_dispatch input size limit (65,535 chars).
   * The release is created as a draft and can be cleaned up later.
   */
  async uploadFileToRelease(file: File): Promise<string> {
    const releaseTag = `temp-upload-${Date.now()}`;
    const fileName = file.name;

    try {
      // Create a draft release
      const { data: release } = await this.octokit.rest.repos.createRelease({
        owner: this.owner,
        repo: this.repo,
        tag_name: releaseTag,
        name: `Temporary upload: ${fileName}`,
        body: `Temporary file upload for workflow processing. This release will be automatically cleaned up.`,
        draft: true,
        prerelease: false,
      });

      // Get the upload URL from the release
      const uploadUrl = release.upload_url.replace(/{[^}]*}$/, '');

      // Upload the file as a release asset using fetch (for browser compatibility)
      // GitHub requires multipart/form-data or direct binary upload
      const formData = new FormData();
      formData.append('file', file, fileName);

      // Use fetch directly since Octokit's uploadReleaseAsset has issues with File objects in browser
      const response = await fetch(`${uploadUrl}?name=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/octet-stream',
        },
        body: file, // Send file directly as binary
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload asset: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const asset = await response.json();

      // Return the browser download URL (not the API URL)
      // The browser_download_url is the direct download link
      return asset.browser_download_url;
    } catch (error) {
      console.error('Error uploading file to release:', error);
      throw new Error(
        `Failed to upload file to temporary release: ${(error as Error).message}. ` +
        `Please ensure your GitHub token has 'repo' scope with write permissions.`
      );
    }
  }

  private getWorkflowFile(patcherType: PatcherType): string {
    const workflowMap: Record<PatcherType, string> = {
      'kernelsu': 'patch-kernelsu.yml',
      'kernelsu-next': 'patch-kernelsu-next.yml',
      'sukisu': 'patch-sukisu.yml',
      'apatch': 'patch-apatch.yml',
    };

    return workflowMap[patcherType];
  }
}
