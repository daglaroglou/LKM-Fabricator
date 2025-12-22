import { GitHubAPI } from '../github-api';
import { downloadBlob, formatBytes, formatDate } from '../utils';
import { WorkflowRun, Artifact } from '../types';

export function MonitorPage(container: HTMLElement, params?: Record<string, string>) {
  if (!params || !params.id) {
    container.innerHTML = '<div class="container"><div class="card">Invalid workflow ID</div></div>';
    return;
  }

  const runId = parseInt(params.id);
  const token = GitHubAPI.getDefaultToken();

  if (!token) {
    container.innerHTML = `
      <div class="container">
        <div class="card">
          <h2>Configuration Error</h2>
          <p class="text-secondary">GitHub token not configured. Please check your environment configuration.</p>
          <a href="/" class="btn mt-2">Go Home</a>
        </div>
      </div>
    `;
    return;
  }

  const api = new GitHubAPI(token);
  let pollInterval: number | null = null;

  const render = (run: WorkflowRun, logs: string, artifacts: Artifact[]) => {
    const status = run.conclusion || run.status;
    const isRunning = run.status !== 'completed';

    container.innerHTML = `
      <header class="header">
        <div class="header-content">
          <a href="/" class="logo">
            <div class="logo-icon">
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 25h10v40h20v10H30V25z" fill="currentColor"/>
                <path d="M65 25h10v25h-10V25z" fill="currentColor"/>
                <path d="M65 60h10v15h-10V60z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <div>LKM Fabricator</div>
              <div class="subtitle">Workflow Monitor</div>
            </div>
          </a>
        </div>
      </header>

      <div class="container">
        <div class="card">
          <div class="flex items-center justify-between" style="margin-bottom: var(--spacing-md);">
            <div>
              <h2 class="card-title" style="margin: 0;">Workflow Run #${runId}</h2>
              <div class="text-secondary" style="font-size: 0.875rem; margin-top: 0.25rem;">
                Started ${formatDate(run.created_at)}
              </div>
            </div>
            <span class="status-badge ${status}">${status}</span>
          </div>
          
          <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
            <a href="${run.html_url}" target="_blank" class="btn btn-secondary" style="text-decoration: none;">
              View on GitHub →
            </a>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <h3 class="card-title" style="margin: 0;">Live Logs</h3>
            ${isRunning ? '<span class="spinner"></span>' : ''}
          </div>
          <div class="logs-container" id="logs-container">
            ${logs.split('\n').map(line => {
              let className = 'log-line';
              if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
                className += ' error';
              } else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
                className += ' success';
              }
              return `<div class="${className}">${escapeHtml(line)}</div>`;
            }).join('')}
          </div>
        </div>

        ${artifacts.length > 0 ? `
          <div class="card">
            <h3 class="card-title">✨ Patched Images Ready</h3>
            <div id="artifacts-list">
              ${artifacts.map(artifact => `
                <div class="flex items-center justify-between" style="padding: var(--spacing-md); background: var(--color-surface-elevated); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);">
                  <div>
                    <div style="font-weight: 600; font-size: 1rem; color: var(--color-text);">${artifact.name}</div>
                    <div class="text-secondary" style="font-size: 0.8rem; margin-top: 0.25rem;">
                      ${formatBytes(artifact.size_in_bytes)} • ${formatDate(artifact.created_at)}
                    </div>
                  </div>
                  <button class="btn download-artifact-btn" data-artifact-id="${artifact.id}" data-artifact-name="${artifact.name}">
                    ⬇ Download
                  </button>
                </div>
              `).join('')}
            </div>
            <div class="form-help" style="margin-top: var(--spacing-sm);">
              💡 Flash the patched boot image to your device using fastboot or a custom recovery
            </div>
          </div>
        ` : ''}

        ${!isRunning && artifacts.length === 0 ? `
          <div class="card text-center">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-sm); opacity: 0.5;">
              ${run.conclusion === 'failure' ? '❌' : '⏳'}
            </div>
            <p class="text-secondary">
              ${run.conclusion === 'failure' ? 'Workflow failed. Check the logs above for details.' : 'No artifacts available yet.'}
            </p>
          </div>
        ` : ''}

        <div class="card text-center">
          <a href="/" class="btn btn-secondary">Start New Patch</a>
        </div>
      </div>
    `;

    setupEventListeners();
    scrollLogsToBottom();
  };

  const setupEventListeners = () => {
    const downloadButtons = document.querySelectorAll('.download-artifact-btn');
    downloadButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const artifactId = parseInt(target.dataset.artifactId || '0');
        const artifactName = target.dataset.artifactName || 'artifact.zip';
        
        target.disabled = true;
        target.innerHTML = '<span class="spinner"></span> Downloading...';

        try {
          const data = await api.downloadArtifact(artifactId);
          const blob = new Blob([data], { type: 'application/zip' });
          downloadBlob(blob, artifactName + '.zip');
          
          target.disabled = false;
          target.innerHTML = 'Download';
        } catch (error) {
          console.error('Download error:', error);
          alert('Error downloading artifact. Please try downloading from GitHub directly.');
          target.disabled = false;
          target.innerHTML = 'Download';
        }
      });
    });
  };

  const scrollLogsToBottom = () => {
    const logsContainer = document.getElementById('logs-container');
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const updatePage = async () => {
    try {
      const run = await api.getWorkflowRun(runId);
      const logs = await api.getWorkflowLogs(runId);
      const artifacts = await api.getArtifacts(runId);

      render(run, logs, artifacts);

      // Stop polling if workflow is complete
      if (run.status === 'completed' && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } catch (error) {
      console.error('Error updating page:', error);
      
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      container.innerHTML = `
        <div class="container">
          <div class="card">
            <h2>Error</h2>
            <p class="text-secondary">Failed to fetch workflow data. This might be due to:</p>
            <ul style="margin-left: 1.5rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
              <li>Invalid or expired GitHub token</li>
              <li>Workflow doesn't exist</li>
              <li>Insufficient permissions</li>
            </ul>
            <div class="mt-3">
              <a href="/" class="btn">Go Home</a>
            </div>
          </div>
        </div>
      `;
    }
  };

  // Initial load
  updatePage();

  // Poll every 3 seconds
  pollInterval = window.setInterval(updatePage, 3000);
}
