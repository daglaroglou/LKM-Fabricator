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

  constructor(token: string = DEFAULT_TOKEN, owner: string = REPO_OWNER, repo: string = REPO_NAME) {
    this.octokit = new Octokit({ auth: token || DEFAULT_TOKEN });
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
    imageBase64?: string
  ): Promise<number> {
    const workflowFile = this.getWorkflowFile(patcherType);
    
    try {
      // Trigger workflow
      await this.octokit.rest.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowFile,
        ref: 'main',
        inputs: {
          image_url: imageUrl || '',
          image_base64: imageBase64 || '',
          patcher_type: patcherType,
        },
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
