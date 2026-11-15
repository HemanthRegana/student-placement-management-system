# GitHub and Vercel Deployment Guide

## 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas project and database cluster.
2. Create a database user with a strong password.
3. Configure Network Access for the hosting environment. Prefer the provider's documented network option; do not leave unrestricted access unless required and understood.
4. Copy the connection string and replace the username, password and database name.

## 2. Publish to GitHub

1. Create a **public** repository named `student-placement-management-system` in your GitHub account.
2. In the project directory, run:

```bash
git init
git add .
git commit -m "chore: initialize SPMS full-stack application"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/student-placement-management-system.git
git push -u origin main
```

3. Confirm `.env.local` is not tracked (`git status --ignored`). Never commit secrets.
4. Use feature branches and pull requests for subsequent work. Suggested branches: `feature/student-profile`, `feature/drive-management`, `feature/application-workflow`, `test/api-suite`.

## 3. Deploy on Vercel

1. Sign in to Vercel and import the GitHub repository.
2. Framework preset: Next.js. Build command: `npm run build`.
3. Add environment variables in Project Settings → Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET` (generate a long random secret)
   - `NEXT_PUBLIC_APP_URL` (the deployed HTTPS URL)
4. Deploy and inspect build logs.
5. Test registration, login, protected dashboard, jobs and applications using synthetic test data.

## 4. Post-deployment checks

- Verify production cookies are HTTPS-only and HTTP-only.
- Confirm database network access and credentials are restricted.
- Check that no secrets appear in GitHub history or build logs.
- Verify the public landing page and mobile layout.
- Do not use real student data until institutional approval, privacy review, backups and access controls are complete.

## 5. Rollback

Use Vercel's deployment history to promote the last known-good deployment. Revert the faulty Git commit, rerun checks and redeploy. For database schema changes, take a backup before applying migrations or destructive changes.
