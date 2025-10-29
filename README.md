# Better Auth MongoDB Demo

A modern authentication template built with Next.js, Better Auth, and MongoDB. It includes user registration, authentication (email/password and GitHub OAuth), and a todo application demonstrating CRUD operations with MongoDB.

## Quick start — for contributors

These steps get a developer up and running locally within minutes.

1. Clone the repo:

```bash
git clone https://github.com/kousthubha-sky/Email-Classifier.git
cd Email-Classifier/better/better-auth-mongodb
```

2. Install dependencies (npm or yarn):

```bash
npm install
# or
yarn install
```

3. Copy environment variable template and update values:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values for `MONGODB_URI`, `BETTER_AUTH_SECRET`, and any OAuth client IDs/secrets you need (e.g. GitHub).

4. Start the dev server:

```bash
npm run dev
```

Then open http://localhost:3000.

Notes:
- This project targets Node.js 18+. Use nvm/n to switch if needed.
- If you prefer pnpm, `pnpm install` and prefix scripts with `pnpm`.

## Environment variables

See `.env.example` for a full list. Minimal required variables for local development:

- MONGODB_URI — MongoDB connection string (e.g. `mongodb://localhost:27017`)
- MONGODB_DB — Database name (optional if included in URI)
- NEXT_PUBLIC_AUTH_URL — e.g. `http://localhost:3000`
- BETTER_AUTH_SECRET — A strong secret (>= 32 chars)

Example (in `.env.local`):

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=better-auth
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-32+ char+secret
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## Scripts

- `npm run dev` — Run development server
- `npm run build` — Build for production
- `npm run start` — Start production server after build
- `npm run lint` — Run ESLint

## Database

- For local development, run a local MongoDB instance or use Atlas. Ensure `MONGODB_URI` points to the database.
- The project uses the MongoDB client in `src/lib/mongodb.ts`. Collections are created automatically as used by Better Auth and the app.

## Linting & Formatting

Run:

```bash
npm run lint
```

Prettier or other formatters may be configured in the repo — follow existing configuration.

## Tests

There are no automated tests included by default. If you add tests, prefer the repository's existing tooling and add an npm script (e.g. `test`).

## Deployment

- This is a standard Next.js app and can be deployed to Vercel, Netlify (with Edge Functions), or any Node host that supports Next.js production builds.
- Typical steps for Vercel:
  1. Configure environment variables in the Vercel project settings.
  2. Set the build command to `npm run build` and the output to `npm run start` (or let Vercel detect Next.js).

## Troubleshooting

- If pages fail to load, check the server logs for missing environment variables.
- If MongoDB connection fails, verify `MONGODB_URI` and network access (firewall/Atlas IP allowlist).

## Contributing

- Please open issues and PRs against the `main` branch.
- Keep changes small and scoped. Add tests for new behaviors when practical.

## Project structure (short)

```
src/
├── app/                    # Next.js App Router (pages, api, routes)
├── components/             # React + shadcn/ui components
├── hooks/                  # Custom hooks
├── lib/                    # Auth, DB, utils
└── middleware.ts           # Route protection middleware
```

## Links & Resources

- Better Auth: https://better-auth.com
- Next.js: https://nextjs.org/docs
- MongoDB docs: https://docs.mongodb.com
- shadcn/ui: https://ui.shadcn.com

---

If you'd like, I can also add a small `CONTRIBUTING.md` or `.env.example` improvements (commented), or a short checklist for reviewers.

## Security

Keeping the app secure is important for contributors and deployers. Recommended practices:

- Keep dependencies up to date. Use `npm outdated`, `npm audit`, and automated tools like Dependabot or Renovate to open PRs for updates.
- Run `npm audit fix` (carefully) and review any high/critical advisories before merging. For deeper analysis, use Snyk or GitHub Security alerts.
- Rotate and protect secrets: do not commit secrets to the repo. Store production secrets in your host (Vercel/Netlify/GitHub Actions Secrets).
- Use a strong `BETTER_AUTH_SECRET` (>= 32 characters) and rotate it if a leak is suspected — note that rotating auth secrets may invalidate existing sessions.
- Require 2FA on GitHub accounts that have access to the project and review collaborator permissions regularly.
- Add a GitHub Actions workflow or other CI checks to run `npm audit`, linting, and tests on pull requests.

Quick commands to check security locally:

```bash
# list outdated packages
npm outdated

# run npm audit and attempt an automatic fix
npm audit
npm audit fix
```

## GitHub OAuth / Login (GitHub sign-in)

This project supports GitHub OAuth for social login. To enable GitHub login locally or in production:

1. Create a GitHub OAuth App on GitHub (Settings → Developer settings → OAuth Apps) or use GitHub Apps depending on your needs.
  - Set the Authorization callback URL to `http://localhost:3000/api/auth/callback/github` for local development (adjust for your deployment URL in production).
2. Copy the `Client ID` and `Client Secret` from the OAuth app and set them in `.env.local`:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

3. Ensure `NEXT_PUBLIC_AUTH_URL` is set correctly (e.g. `http://localhost:3000`) so redirect URLs match.

Notes:
- If you see errors during OAuth, check GitHub app settings (redirect URL, allowed domains) and server logs for more details.
- When deploying to GitHub-backed CI or Vercel, store the `GITHUB_CLIENT_SECRET` in the platform's secret store (never commit it).
- If you meant a different "GitHub codes" flow (device flow), the project currently uses standard OAuth redirect flow; we can add device flow support if you need it.

---

If you'd like, I can also add a small `CONTRIBUTING.md`, a GitHub Actions security workflow (audit + lint), or enable a Dependabot config file — tell me which you'd prefer and I can add it.
