# Privion Backend Hosting Handoff

Copy everything below into a new ChatGPT conversation when asking for deployment guidance. Do not paste the real `.env` file or any secrets.

---

## What I need

Guide me interactively through hosting this application. Start by asking which hosting provider, domain/subdomain layout, and PostgreSQL provider I want to use. Prefer a simple managed Node.js service plus managed PostgreSQL. Do not assume a serverless deployment is suitable without accounting for the custom long-running Express server, native Argon2 dependency, multipart uploads, and Prisma migrations.

Give exact provider-specific configuration, build/start/migration commands, DNS records, environment variables, CORS settings, health-check path, and post-deployment verification steps. Never ask me to paste secret values into chat. Tell me where to enter them in the provider's secret/environment dashboard.

## Repository and runtime

- Repository name: `priviontech-backend`
- Node requirement: Node.js 20 or newer.
- Language: TypeScript.
- Package manager: npm with committed `package-lock.json`.
- Main API stack: Express 5, Prisma 6, PostgreSQL, Zod.
- The repository also contains a small Next.js 15 application.
- `src/server.ts` starts Next and mounts the Express application before the Next request handler.
- This is a long-running Node HTTP server, not a collection of serverless functions.
- The process binds to `HOST`, normally `0.0.0.0`.
- Local backend port is `8000`, but a hosting platform may inject a different `PORT`; its value must be honored.
- Production command runs `tsx src/server.ts`; `tsx` is currently a development dependency. The host must install dev dependencies, or the deployment configuration/package layout must be adjusted.
- The application sets Express `trust proxy` to `1`, which is appropriate behind one managed reverse proxy.

## Important paths

- Server entry: `src/server.ts`
- Express application and routes: `src/app.ts`
- Environment validation: `src/config/env.ts`
- Prisma schema: `prisma/schema.prisma`
- SQL migrations: `prisma/migrations/`
- Seed: `prisma/seed.ts`
- Public API documentation: `docs/API.md`
- Admin documentation: `docs/ADMIN.md`
- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/openapi.json`
- Health check: `/api/v1/health`

## Commands

```text
npm install
npm run build
npm start
npm run typecheck
npm run lint
npm test
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run db:studio
npm run admin:build
```

Use `npx prisma migrate deploy` in production. Do not use `prisma migrate dev` against production.

Recommended release sequence:

```text
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm start
```

The seed command is idempotent, but it also creates/updates the configured administrator and demo services/projects. Run it intentionally, normally once for a new environment. It reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Database

- Provider: PostgreSQL.
- Prisma uses `DATABASE_URL`.
- Local Docker uses PostgreSQL 16.
- Local-only connection:

```text
postgresql://privion:privion@localhost:5433/privion?schema=public
```

- Never use the local username/password in production.
- Use the managed PostgreSQL provider's private/internal connection string when the backend and database are on the same platform/network.
- Require TLS when the provider requires it, usually through parameters supplied in its connection URL.
- Run all checked-in migrations during deployment.
- Database tables include administrators, services, projects/apps, enquiries, service requests, settings, relation tables, and Prisma migration history.
- Projects include websites, mobile apps, web apps, desktop apps, platforms, and case studies, distinguished by `ProjectKind`.

## Required environment variables

Use production secrets, not the values from local development:

```env
NODE_ENV=production
PORT=<normally injected by the host>
HOST=0.0.0.0
DATABASE_URL=<managed PostgreSQL connection URL>
JWT_SECRET=<cryptographically random value of at least 32 characters>
JWT_EXPIRES_IN=8h
COOKIE_NAME=privion_admin
CORS_ORIGIN=https://www.example.com,https://admin.example.com
ADMIN_NAME=<initial administrator name>
ADMIN_EMAIL=<initial administrator email>
ADMIN_PASSWORD=<strong initial password>

CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
CLOUDINARY_URL=cloudinary://<api-key>:<api-secret>@<cloud-name>
CLOUDINARY_UPLOAD_PRESET=privion_backend_uploads
CLOUDINARY_FOLDER=privion-tech
CLOUDINARY_SECURE=true
```

`JWT_SECRET`, `ADMIN_PASSWORD`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL`, and `DATABASE_URL` are secrets. Never commit or expose them. The checked-in `.env.example` contains placeholders; the actual `.env` is gitignored.

The public company contact address stored in site settings is `priviontech@gmail.com`. Contact forms are stored in PostgreSQL. Sending notification emails is not currently implemented; SMTP or an email API would be a separate deployment feature.

## API behavior

- Public API prefix: `/api/v1`.
- Public services: `GET /api/v1/services` and `GET /api/v1/services/:slug`.
- Public projects: `GET /api/v1/projects` and `GET /api/v1/projects/:slug`.
- Apps are projects. There is no `/apps` endpoint. Filter with `kind=MOBILE_APP`, `WEB_APP`, `DESKTOP_APP`, or `PLATFORM`.
- Contact submission: `POST /api/v1/enquiries`.
- Detailed request: `POST /api/v1/service-requests`.
- Public settings: `GET /api/v1/settings`.
- Health: `GET /api/v1/health`.
- Admin endpoints are under `/api/v1/admin`.
- Standard responses use `{ success, data, meta }`; errors use `{ success: false, error: { code, message, fields } }`.
- General and form-specific rate limits are in memory. This is acceptable for one application instance, but a Redis-backed distributed limiter should be considered before horizontal scaling.

## Authentication and browser deployment

- Admin JWTs are stored in an HTTP-only cookie.
- The cookie uses `Secure` in production and `SameSite=Lax`.
- CORS uses the comma-separated exact origins from `CORS_ORIGIN` and allows credentials.
- Admin browser requests use `credentials: "include"`.
- Prefer frontend, admin, and API hosts under the same registrable domain, for example:

```text
www.privion.example
admin.privion.example
api.privion.example
```

- If unrelated domains are used, `SameSite=Lax` may prevent cross-site authenticated fetches. The cookie/CORS/CSRF design would need to be revised before deployment.
- HTTPS is mandatory for production admin authentication because the cookie is secure.
- After deployment, confirm the login response sets the cookie and that `/api/v1/admin/auth/me` works from the actual admin origin.

## Cloudinary

- Cloudinary credentials have been tested successfully in local development.
- Upload preset: signed.
- Admin upload endpoint: `POST /api/v1/admin/media/upload`.
- Multipart field name: `file`.
- Maximum size: 10 MB.
- Accepted: JPG, PNG, WebP, GIF, SVG, PDF.
- Uploads use the signed preset and configured Cloudinary folder.
- Deletion endpoint is administrator-only.
- Cloudinary credentials must exist only on the backend.

## Admin panel

- Located in the `admin/` directory.
- Stack: React 19, Vite, React Router.
- Local dev port: `5173`.
- Local Vite proxy forwards `/api` to `http://localhost:8000`.
- Build command: `npm run admin:build`.
- Output: `admin/dist`.
- It has structured service/project editors, Cloudinary upload, publication controls, search/filtering, request/enquiry review, settings, and password management.

Critical production caveat: `admin/src/api.ts` currently calls relative paths such as `/api/v1/...`. The local Vite proxy exists only during development. Production must do one of the following:

1. Serve/reverse-proxy the static admin site and backend API under the same origin; or
2. Change the admin API client to use a build-time variable such as `VITE_API_BASE_URL=https://api.example.com`, while retaining `credentials: "include"` and configuring backend CORS/cookies correctly.

Ask me which architecture I prefer before providing final admin deployment commands.

## Separate public frontend

The public Next.js frontend is a separate local repository named `priviontech`; it is not inside this backend repository.

Critical production caveat: its API base URL is currently hardcoded in `data/constants.ts` as:

```text
http://localhost:8000/api/v1
```

Before hosting the frontend, replace that with an environment variable such as:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1
```

The frontend uses server-side `fetch` with `cache: "no-store"` for public catalogue data. Its deployment environment must be able to reach the backend URL.

## Docker

`docker-compose.yml` is for local PostgreSQL development:

- Container image: `postgres:16-alpine`.
- Host port: `5433`.
- Container port: `5432`.
- Named volume: `privion_postgres`.

Do not copy the local Compose credentials to production. A production host can use managed PostgreSQL instead of deploying this Compose file.

## Persistence and scaling

- Durable application data is in PostgreSQL.
- Media is in Cloudinary, so the Node filesystem does not need persistent storage.
- The API itself can run on an ephemeral filesystem.
- In-memory rate limiting is per process. Horizontal scaling needs shared rate-limit storage.
- Apply migrations once per release, not concurrently from every autoscaled instance unless the platform provides a release/predeploy command.
- Back up PostgreSQL using the database provider's automated backups and point-in-time recovery where available.

## Security checklist

- HTTPS for all public hosts.
- Strong unique JWT and administrator secrets.
- Rotate the initial administrator password after first login.
- Exact CORS origins; never use `*` with credentialed requests.
- Do not expose Cloudinary API secret or `CLOUDINARY_URL` to either frontend.
- Restrict database access to the backend/private network.
- Enable managed database backups.
- Review Swagger exposure if API documentation should not be public in production.
- Test file size/type rejection on the media endpoint.
- Render Markdown with HTML sanitization.
- Add external uptime monitoring for `/api/v1/health`.

## Current verification state

The project has recently passed:

- TypeScript checking.
- ESLint.
- 13 Vitest API tests.
- Next.js production build.
- Admin Vite production build.
- Prisma migrations and seed against local PostgreSQL.
- Cloudinary credential ping.
- Live API health and public catalogue requests.
- Protected media endpoint authentication check.

## Post-deployment smoke tests

Ask me to run or help me run:

```text
GET https://api.example.com/api/v1/health
GET https://api.example.com/api/v1/settings
GET https://api.example.com/api/v1/services?page=1&limit=1
GET https://api.example.com/api/v1/projects?page=1&limit=1
GET https://api.example.com/api/docs
```

Then test:

1. Admin login and `/admin/auth/me`.
2. Create/edit/archive a temporary service.
3. Upload and delete a temporary Cloudinary image.
4. Submit a test enquiry.
5. Submit a complete service request.
6. Verify public frontend service/project pages.
7. Verify CORS from the real frontend and admin origins.
8. Verify database backups and migration status.

## Questions to ask me before choosing a deployment plan

1. Which provider do I want: Railway, Render, Fly.io, a VPS, or another host?
2. Do I already own the production domain?
3. What subdomains should frontend, admin, and API use?
4. Should PostgreSQL be hosted by the same provider?
5. Should admin be same-origin behind a reverse proxy or deployed separately?
6. Should seed/demo content be loaded in production?
7. Do I want automated GitHub deployments?
8. Is one API instance sufficient initially?
9. Do I need email notifications for enquiries and requests?

Do not proceed with destructive database actions, DNS changes, or production secret rotation without confirming the exact target and effect.

---
