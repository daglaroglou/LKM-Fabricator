import { ImageSourceType, PatcherType } from '../types';
import { GitHubAPI } from '../github-api';
import { uploadToCatbox } from '../utils';
import { navigateTo } from '../router';
import { icons, logos } from '../assets/icons';

const patcherInfo = {
  kernelsu: {
    name: 'KernelSU',
    description: 'Original KernelSU for Android 13+',
    logo: logos.kernelsu
  },
  'kernelsu-next': {
    name: 'KernelSU Next',
    description: 'Latest KernelSU branch for Android 14+',
    logo: logos['kernelsu-next']
  },
  sukisu: {
    name: 'SUKISU',
    description: 'Enhanced KernelSU fork',
    logo: logos.sukisu
  },
  apatch: {
    name: 'APatch',
    description: 'Alternative kernel patching method',
    logo: logos.apatch
  }
};

export function HomePage(container: HTMLElement) {
  let selectedFile: File | null = null;
  let sourceType: ImageSourceType = 'file';
  let selectedPatcher: PatcherType = 'kernelsu';

  const render = () => {
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
              <div class="subtitle">Patch boot images with ease</div>
            </div>
          </a>
        </div>
      </header>

      <div class="container">
        <!-- Main Form Card -->
        <div class="card">
          <h2 class="card-title">Patch Your Image</h2>
          
          <form id="patch-form">
            <!-- Source Type -->
            <div class="form-group">
              <label class="form-label">Image Source</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="source-type" value="file" checked />
                  <span>${icons.upload}</span>
                  <span>Upload File</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="source-type" value="url" />
                  <span>${icons.link}</span>
                  <span>From URL</span>
                </label>
              </div>
            </div>

            <!-- File Upload -->
            <div class="form-group" id="file-upload-group">
              <label class="form-label">Boot/Init Boot Image</label>
              <div class="file-upload" id="file-upload">
                <div class="file-upload-icon">${icons.upload}</div>
                <div class="file-upload-text">
                  <strong>Click to upload</strong> or drag and drop<br>
                  <span style="color: var(--color-text-tertiary);">boot.img or init_boot.img (will be uploaded to Catbox.moe)</span>
                </div>
              </div>
              <input type="file" id="file-input" accept=".img" style="display: none;" />
              <div id="file-name"></div>
            </div>

            <!-- URL Input -->
            <div class="form-group" id="url-input-group" style="display: none;">
              <label class="form-label" for="image-url">Image URL</label>
              <input 
                type="url" 
                id="image-url" 
                class="form-input" 
                placeholder="https://example.com/boot.img"
              />
              <div class="form-help">
                Direct download link to boot.img or init_boot.img
              </div>
            </div>

            <!-- Patcher Type Selection -->
            <div class="form-group">
              <label class="form-label">Select Root Method *</label>
              <div class="patcher-grid" id="patcher-grid">
                ${Object.entries(patcherInfo).map(([key, info]) => `
                  <label class="patcher-option ${key === 'kernelsu' ? 'selected' : ''}" data-patcher="${key}">
                    <input type="radio" name="patcher" value="${key}" ${key === 'kernelsu' ? 'checked' : ''} />
                    <div class="patcher-logo">
                      <img src="${info.logo}" alt="${info.name}" />
                    </div>
                    <div class="patcher-name">${info.name}</div>
                    <div class="patcher-description">${info.description}</div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-block" id="submit-btn">
              Start Patching →
            </button>

            <div id="error-message"></div>
          </form>
        </div>

        <!-- How It Works Card -->
        <div class="card">
          <h3 class="card-title">${icons.info} How It Works</h3>
          <ol class="how-it-works-list">
            <li>Select your preferred patcher (KernelSU, SUKISU, APatch)</li>
            <li>Upload your boot.img (will be uploaded to Catbox.moe) or provide a direct download URL</li>
            <li>Click "Start Patching" to trigger the GitHub Actions workflow</li>
            <li>Monitor the patching process in real-time with live logs</li>
            <li>Download your patched boot image when complete</li>
            <li>Flash to your device and enjoy root access!</li>
          </ol>
        </div>
      </div>
    `;

    setupEventListeners();
  };

  const setupEventListeners = () => {
    const form = document.getElementById('patch-form') as HTMLFormElement;
    const fileUpload = document.getElementById('file-upload') as HTMLDivElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const fileName = document.getElementById('file-name') as HTMLDivElement;
    const sourceTypeRadios = document.querySelectorAll('input[name="source-type"]');
    const patcherOptions = document.querySelectorAll('.patcher-option');
    const fileUploadGroup = document.getElementById('file-upload-group') as HTMLDivElement;
    const urlInputGroup = document.getElementById('url-input-group') as HTMLDivElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;

    // Patcher selection
    patcherOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const patcherValue = target.dataset.patcher as PatcherType;
        
        // Update visual state
        patcherOptions.forEach(opt => opt.classList.remove('selected'));
        target.classList.add('selected');
        
        // Update radio button
        const radio = target.querySelector('input[type="radio"]') as HTMLInputElement;
        radio.checked = true;
        selectedPatcher = patcherValue;
      });
    });

    // Source type change
    sourceTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        sourceType = target.value as ImageSourceType;
        
        if (sourceType === 'file') {
          fileUploadGroup.style.display = 'block';
          urlInputGroup.style.display = 'none';
        } else {
          fileUploadGroup.style.display = 'none';
          urlInputGroup.style.display = 'block';
        }
      });
    });

    // File upload click
    fileUpload.addEventListener('click', () => {
      fileInput.click();
    });

    // File upload drag & drop
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.classList.add('drag-over');
    });

    fileUpload.addEventListener('dragleave', () => {
      fileUpload.classList.remove('drag-over');
    });

    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.classList.remove('drag-over');
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFileSelect(target.files[0]);
      }
    });

    function handleFileSelect(file: File) {
      if (!file.name.endsWith('.img')) {
        errorMessage.innerHTML = '<div class="error-message">⚠️ Please select a .img file</div>';
        return;
      }

      selectedFile = file;
      fileName.innerHTML = `<div class="file-name">${icons.check} ${file.name} <span style="color: var(--color-text-tertiary);">(${(file.size / (1024 * 1024)).toFixed(2)} MB)</span></div>`;
      errorMessage.innerHTML = '';
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.innerHTML = '';

      const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Starting workflow...';

      try {
        const githubToken = GitHubAPI.getDefaultToken();

        if (!githubToken) {
          throw new Error('GitHub token not configured. Please check your environment configuration.');
        }

        // Initialize API early so it can be used for file uploads
        const api = new GitHubAPI(githubToken);

        let imageUrl: string | undefined;
        // let imageBase64: string | undefined;

        if (sourceType === 'file') {
          if (!selectedFile) {
            throw new Error('Please select a file');
          }
          
          // Upload .img file to Catbox.moe and get URL
          submitBtn.innerHTML = '<span class="spinner"></span> Uploading to Catbox.moe...';
          imageUrl = await uploadToCatbox(selectedFile);
          // imageBase64 = undefined;
        } else {
          imageUrl = (document.getElementById('image-url') as HTMLInputElement).value;
          if (!imageUrl) {
            throw new Error('Please provide an image URL');
          }
        }

        // Trigger workflow
        const runId = await api.triggerWorkflow(selectedPatcher, imageUrl); // , imageBase64);

        // Navigate to monitor page
        navigateTo(`/monitor/${runId}`);

      } catch (error) {
        console.error('Error:', error);
        errorMessage.innerHTML = `<div class="error-message">⚠️ ${(error as Error).message}</div>`;
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Start Patching →';
      }
    });
  };

  render();
}
