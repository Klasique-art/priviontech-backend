# Privion Technologies platform

Production-oriented Express/TypeScript REST API with PostgreSQL/Prisma and a separate Vite/React admin panel.

## Local development

Requires Node 20+, npm, Docker and Docker Compose.

```bash
copy .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API: `http://localhost:8000/api/v1` · Swagger: `http://localhost:8000/api/docs`

In another terminal:

```bash
npm --prefix admin install
npm run admin:dev
```

Admin: `http://localhost:5173`. Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`.

## Commands

`npm run dev`, `build`, `start`, `lint`, `test`, `typecheck`, `db:migrate`, `db:seed`, `db:studio`, `admin:dev`, and `admin:build` provide the requested workflows.

## Deployment

Supply all `.env.example` variables through the deployment secret manager. Use a strong random 32+ character JWT secret, HTTPS, an exact admin CORS origin, and a managed PostgreSQL database. Run `npx prisma migrate deploy` before starting the application, then `npm run build && npm start`. Build and host `admin/dist` behind HTTPS on the configured origin. Back up PostgreSQL and rotate administrator credentials.

See [API documentation](docs/API.md) and [admin guide](docs/ADMIN.md).
