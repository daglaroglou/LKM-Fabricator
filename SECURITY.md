# Security Guidelines

## ⚠️ CRITICAL: Token Security

### For Repository Owners

If you're hosting this project publicly with a default token:

1. **NEVER commit your .env file** - It's already in .gitignore, keep it there!
2. **Use a dedicated token** - Create a token specifically for this project
3. **Limit token permissions** - Only enable `repo` and `workflow` scopes
4. **Set token expiration** - Use 30-90 day expiration
5. **Rotate regularly** - Change your token every 30-90 days
6. **Monitor usage** - Check GitHub logs for unexpected activity

### For Users

If you're using someone else's hosted version:

1. **Provide your own token** - Don't rely on the default token
2. **Your token = your workflows** - Workflows will run in YOUR repository
3. **Revoke when done** - Delete the token after you're finished
4. **Never share tokens** - Keep your token private

## Environment Variables

This project uses environment variables to store sensitive data:

```bash
# .env file (NEVER commit this!)
VITE_GITHUB_TOKEN=your_token_here
VITE_GITHUB_OWNER=your_username
VITE_GITHUB_REPO=your_repo_name
```

## Token Exposure

If you accidentally expose your token:

1. **Immediately revoke it** at https://github.com/settings/tokens
2. **Generate a new token** with fresh credentials
3. **Update your .env file** with the new token
4. **Check recent activity** in your repository's Actions tab

## Production Deployment

For GitHub Pages deployment:

### Option 1: No Default Token (Recommended for Public)
- Don't set `VITE_GITHUB_TOKEN` in .env
- Users must provide their own tokens
- Most secure option

### Option 2: With Default Token (Convenience)
- Set token in .env file
- Users can use default or override
- More convenient but requires careful token management

## GitHub Actions Secrets

For the deployment workflow, you can use GitHub Secrets instead of .env:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `GH_TOKEN` - Your GitHub token
   - `GH_OWNER` - Your username
   - `GH_REPO` - Your repo name

3. Update `vite.config.ts` to use secrets during build

## Best Practices

✅ **DO:**
- Use fine-grained tokens when possible
- Set minimum required scopes
- Use short expiration periods
- Keep .env in .gitignore
- Revoke tokens you're not using
- Monitor GitHub activity logs

❌ **DON'T:**
- Commit tokens to git
- Share tokens in chat/email
- Use personal tokens for production
- Give unnecessary permissions
- Use tokens without expiration
- Reuse tokens across projects

## Checking for Exposed Tokens

If you're unsure if you've committed a token:

```bash
# Search git history for potential tokens
git log -p | grep -i "ghp_"

# Check all files
git grep "ghp_"
```

If found:
1. Revoke the token immediately
2. Use git filter-repo or BFG Repo-Cleaner to remove from history
3. Force push to remote (coordinate with collaborators)

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.

## Additional Resources

- [GitHub Token Security Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Managing Your Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [About Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
