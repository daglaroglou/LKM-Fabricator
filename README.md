# LKM Fabricator

A web-based tool for patching Android boot images with KernelSU, KernelSU Next, SUKISU, and APatch. Built with TypeScript and Vite, powered by GitHub Actions.

## Features

- 🎨 **Monochrome Design** - Clean, modern interface with a monochrome color palette
- 📤 **Flexible Upload** - Upload boot images or provide a URL
- ⚡ **Multiple Patchers** - Support for KernelSU, KernelSU Next, SUKISU, and APatch
- 📊 **Live Monitoring** - Real-time workflow logs and status updates
- 📦 **Easy Download** - Download patched images directly from the UI
- 🔄 **Auto Cleanup** - Artifacts automatically deleted after 1 hour

## Setup

### Prerequisites

- Node.js 18+ and npm
- A GitHub account
- A GitHub Personal Access Token with `repo` and `workflow` scopes

### Installation

1. Clone the repository:

```bash
git clone https://github.com/daglaroglou/LKM-Fabricator.git
cd LKM-Fabricator
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables (copy `.env.example` to `.env`):

```bash
cp .env.example .env
```

Then edit `.env` file with your GitHub token:

```bash
VITE_GITHUB_TOKEN=your_github_token_here
```

**⚠️ IMPORTANT**: Never commit the `.env` file! It's already in `.gitignore`.

4. Run the development server:

```bash
npm run dev
```

### Vercel Deployment (Recommended)

1. Push your code to GitHub (if not already done)

2. Go to [Vercel](https://vercel.com) and sign in with your GitHub account

3. Click "Add New Project" and import your `LKM-Fabricator` repository

4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add environment variable:
   - Go to "Environment Variables" section
   - Add `VITE_GITHUB_TOKEN` with your GitHub Personal Access Token
   - Make sure to add it for all environments (Production, Preview, Development)

6. Click "Deploy"

7. Your site will be live at `https://your-project-name.vercel.app`

**Note**: The GitHub token is securely stored in Vercel's environment variables and will be embedded during build time.

### Creating a GitHub Token

1. Go to https://github.com/settings/tokens/new
2. Give it a name (e.g., "LKM Fabricator")
3. Select expiration (recommend: 90 days)
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. Copy the token (you won't be able to see it again!)

## Usage

1. **Enter GitHub Token** - Paste your GitHub Personal Access Token (stored locally in browser)

2. **Choose Image Source**:
   - **Upload File**: Select your boot.img or init_boot.img file
   - **From URL**: Provide a direct download link to the image

3. **Select Patcher Type**:
   - **KernelSU**: Standard KernelSU patching
   - **KernelSU Next**: Latest KernelSU Next branch
   - **SUKISU**: SUKISU fork of KernelSU
   - **APatch**: APatch kernel patching

4. **Start Patching** - Click the button to trigger the workflow

5. **Monitor Progress** - Watch real-time logs as your image is patched

6. **Download** - Once complete, download your patched boot image

## How It Works

1. **Frontend** (Vite + TypeScript):
   - User uploads image or provides URL
   - Calls GitHub API to trigger workflow
   - Polls for workflow status and logs
   - Downloads artifacts when complete

2. **GitHub Actions**:
   - Receives image (URL or base64)
   - Downloads appropriate patcher tool
   - Patches the boot image
   - Uploads as artifact with 1-day retention

3. **Cleanup**:
   - Hourly cron job deletes artifacts older than 1 hour
   - Keeps repository clean

## Project Structure

```
LKM-Fabricator/
├── .github/
│   └── workflows/          # GitHub Actions workflows
│       ├── patch-kernelsu.yml
│       ├── patch-kernelsu-next.yml
│       ├── patch-sukisu.yml
│       ├── patch-apatch.yml
│       └── cleanup-artifacts.yml
├── public/
│   └── logo.svg           # Site logo
├── src/
│   ├── pages/
│   │   ├── HomePage.ts    # Main upload page
│   │   └── MonitorPage.ts # Workflow monitor
│   ├── github-api.ts      # GitHub API wrapper
│   ├── router.ts          # Client-side routing
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions
│   ├── main.ts            # Entry point
│   └── style.css          # Monochrome styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Configuration

### Workflow Customization

Edit the workflow files in `.github/workflows/` to customize:
- Patcher versions
- Build parameters
- KMI versions
- Additional steps

### Artifact Retention

Default retention is 1 day (GitHub Actions setting), but cleanup runs hourly.

To change retention in `cleanup-artifacts.yml`:
```yaml
const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in ms
```

## Security Notes

- GitHub tokens are stored in browser localStorage only
- Never commit tokens to the repository
- Use tokens with minimal required scopes
- Regularly rotate your tokens
- Consider using fine-grained tokens for better security

## Troubleshooting

### Workflow not triggering
- Verify your GitHub token has `workflow` scope
- Ensure workflows are enabled in repository settings
- Check that the token is correctly set in Vercel environment variables (for production) or `.env` file (for local development)

### Artifacts not downloading
- Verify your token has `repo` scope
- Check browser console for errors
- Try downloading directly from GitHub Actions page

### Base64 encoding issues
- Large files (>100MB) may have issues with base64 encoding
- Consider using URL upload for large files
- GitHub has API payload size limits

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Credits

- KernelSU: https://github.com/tiann/KernelSU
- KernelSU Next: https://github.com/rifsxd/KernelSU-Next
- SUKISU: https://github.com/dabao1955/kernel_su
- APatch: https://github.com/bmax121/APatch

## Disclaimer

This tool is for educational purposes. Always backup your device before flashing modified boot images. The authors are not responsible for any damage to your device.
