# Privion Backend Implementation Prompt

Build a complete, production-ready but intentionally simple backend and admin panel for the Privion Technologies company website.

## Project context

Privion Technologies is a service-based technology company.

Public visitors should be able to:

1. View all active services offered by Privion.
2. View services in the exact order configured by an administrator.
3. Open an individual service page.
4. View published projects/case studies.
5. Open an individual project/case-study page.
6. Submit a general enquiry through the Contact Us page.
7. Submit a service request through the Start a Project page.

Public visitors do not need authentication or user accounts.

Administrators must have secure authentication because they can modify website content and view private submissions.

## Technology stack

Use:

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Zod for request validation
- JWT stored in secure HTTP-only cookies for admin authentication
- React and Vite for the admin panel
- REST API
- Vitest or Jest for testing
- ESLint and Prettier
- Docker Compose for local PostgreSQL
- Swagger/OpenAPI for interactive API documentation

Use a clean modular architecture without unnecessary enterprise complexity.

Suggested backend structure:

```text
src/
  config/
  controllers/
  middleware/
  modules/
    auth/
    services/
    projects/
    enquiries/
    project-requests/
    media/
    settings/
  routes/
  schemas/
  services/
  utils/
  app.ts
  server.ts
```

The admin panel can live in:

```text
admin/
  src/
    components/
    layouts/
    pages/
    api/
    hooks/
    types/
```

## Database models

### 1. Admin

Fields:

- `id`: UUID
- `name`
- `email`: unique
- `passwordHash`
- `role`: `ADMIN` or `EDITOR`
- `isActive`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Seed one administrator using environment variables:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Never store plain-text passwords.

### 2. Service

Fields:

- `id`: UUID
- `title`
- `slug`: unique
- `shortDescription`
- `description`: long-form Markdown
- `icon`: optional string
- `imageUrl`: optional string
- `features`: array of strings
- `order`: integer
- `isActive`: boolean
- `seoTitle`: optional
- `seoDescription`: optional
- `createdAt`
- `updatedAt`

Requirements:

- Administrators can create, update, archive, restore, and permanently delete services.
- The public API returns only active services.
- Public services must be sorted by `order` ascending.
- Administrators must be able to reorder services.
- Provide a bulk reorder endpoint that accepts an ordered array of service IDs.
- Service slugs must be unique and URL-safe.
- Automatically generate a slug from the title when none is supplied.

### 3. Project

Fields:

- `id`: UUID
- `title`
- `slug`: unique
- `clientName`: optional
- `summary`
- `content`: long-form Markdown
- `coverImageUrl`: optional
- `galleryImages`: array of image URLs
- `serviceIds`: relation to services
- `technologies`: array of strings
- `projectUrl`: optional
- `completionDate`: optional date
- `order`: integer
- `status`: `DRAFT`, `PUBLISHED`, or `ARCHIVED`
- `isFeatured`: boolean
- `seoTitle`: optional
- `seoDescription`: optional
- `createdAt`
- `updatedAt`
- `publishedAt`: optional

Requirements:

- Administrators can create, edit, publish, unpublish, archive, restore, and delete projects.
- The public API returns only published projects.
- Projects can be related to multiple services.
- Projects must support ordering.
- Provide a bulk reorder endpoint.
- Support filtering projects by service, technology, and featured status.
- Support pagination.
- Automatically generate a unique slug when none is supplied.

### 4. Enquiry

Used for general Contact Us submissions.

Fields:

- `id`: UUID
- `name`
- `email`
- `phone`: optional
- `company`: optional
- `subject`
- `message`
- `status`: `NEW`, `IN_PROGRESS`, `RESOLVED`, or `SPAM`
- `adminNotes`: optional
- `createdAt`
- `updatedAt`

Requirements:

- Public visitors can create enquiries.
- Administrators can list, search, view, update status, add notes, and delete enquiries.
- Enquiry administration endpoints must never expose data publicly.

### 5. ProjectRequest

Used when a visitor requests Privion's services.

Fields:

- `id`: UUID
- `name`
- `email`
- `phone`: optional
- `company`: optional
- `serviceIds`: selected service relations
- `projectType`: optional
- `projectSummary`
- `budgetRange`: optional
- `desiredStartDate`: optional
- `timeline`: optional
- `attachmentUrl`: optional
- `status`: `NEW`, `REVIEWING`, `CONTACTED`, `ACCEPTED`, `DECLINED`, or `SPAM`
- `adminNotes`: optional
- `createdAt`
- `updatedAt`

Requirements:

- Public visitors can submit project requests.
- A request may select one or more active services.
- Validate that submitted service IDs exist and are active.
- Administrators can list, filter, search, inspect, update, annotate, and delete requests.
- Project-request administration endpoints must be protected.

### 6. SiteSettings

Fields:

- `id`
- `companyName`
- `contactEmail`
- `contactPhone`: optional
- `address`: optional
- `linkedInUrl`: optional
- `defaultSeoTitle`
- `defaultSeoDescription`
- `updatedAt`

Only administrators can modify settings. Public users may read safe public settings.

## Public API

Prefix all endpoints with `/api/v1`.

### `GET /api/v1/services`

- Return active services ordered by `order`.
- Support a lightweight list response suitable for cards.

### `GET /api/v1/services/:slug`

- Return one active service by slug.
- Return 404 for missing or inactive services.

### `GET /api/v1/projects`

- Return published projects.
- Support `page`, `limit`, `service`, `technology`, and `featured`.
- Sort by configured order, followed by publication date.

### `GET /api/v1/projects/:slug`

- Return one published project with related services.

### `POST /api/v1/enquiries`

- Submit a general enquiry.

### `POST /api/v1/project-requests`

- Submit a request for services.

### `GET /api/v1/settings`

- Return only public company settings.

### `GET /api/v1/health`

- Return API and database health information without exposing secrets.

## Admin authentication API

Implement:

- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/me`
- `POST /api/v1/admin/auth/change-password`

Requirements:

- Use Argon2 or bcrypt for password hashing.
- Use secure, HTTP-only, SameSite cookies.
- Enable secure cookies in production.
- Add login rate limiting.
- Reject inactive administrators.
- Add authentication and role middleware.
- Configure CORS from environment variables.
- Do not expose password hashes or authentication secrets.

## Admin content API

Implement protected CRUD endpoints for:

- `/api/v1/admin/services`
- `/api/v1/admin/projects`
- `/api/v1/admin/enquiries`
- `/api/v1/admin/project-requests`
- `/api/v1/admin/settings`

Include:

- `POST /api/v1/admin/services/reorder`
- `POST /api/v1/admin/projects/reorder`

Reorder request example:

```json
{
  "ids": [
    "first-item-uuid",
    "second-item-uuid",
    "third-item-uuid"
  ]
}
```

The backend must update all order values inside a database transaction.

Use soft deletion or archival where content may be referenced by projects or submissions. Prevent destructive deletion when it would break existing relationships unless the administrator explicitly confirms a permanent deletion endpoint.

## Admin panel

Create a clean, responsive admin panel with:

1. A login page.
2. A dashboard showing active services, published projects, draft projects, new enquiries, and new project requests.
3. Services management:
   - List services.
   - Add and edit services.
   - Activate and deactivate services.
   - Reorder services using drag and drop.
   - Archive or delete services.
4. Projects management:
   - List and filter projects.
   - Add and edit projects.
   - Provide a Markdown content editor.
   - Choose related services.
   - Manage technologies.
   - Manage cover and gallery image URLs.
   - Provide draft, publish, and archive controls.
   - Provide a featured toggle.
   - Support drag-and-drop ordering.
5. Enquiries management:
   - Search and filter by status.
   - Read the full enquiry.
   - Change status.
   - Add private admin notes.
   - Delete spam.
6. Project request management:
   - Search and filter.
   - View selected services and request details.
   - Change status.
   - Add private admin notes.
7. A site settings page.
8. An admin profile and change-password page.
9. Confirmation dialogs for destructive actions.
10. Loading, empty, error, and success states.

Keep the visual design neutral and functional because it will be customized later.

## Media

For the initial implementation, support image URLs rather than requiring a complex media-management platform.

Optionally provide a simple upload abstraction that can later support:

- Local development storage
- Amazon S3
- Cloudinary

Do not tightly couple database records to one storage provider.

## Validation and error responses

Validate:

- Email addresses
- Required fields
- String lengths
- UUIDs
- Slugs
- Enum values
- Pagination limits
- URLs
- Selected service IDs
- Uploaded file type and size, if uploads are implemented

Use one consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "fields": {
      "email": "Enter a valid email address."
    }
  }
}
```

Use one consistent success format:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

For paginated responses, include:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 30,
    "totalPages": 3
  }
}
```

## Security

Implement:

- Helmet
- CORS configuration
- General API rate limiting
- Stricter rate limits for login and public form submissions
- Request body size limits
- Zod validation
- Parameterized database queries through Prisma
- Secure password hashing
- Protected admin routes
- Safe error handling
- Environment-variable validation
- No secrets in source control
- Basic spam protection using a honeypot field and rate limits
- Sanitization or safe rendering guidance for Markdown content
- Audit timestamps

Do not add public user registration, public login, shopping carts, payments, subscriptions, or other unnecessary systems.

## Documentation

Create a complete Markdown API document at `docs/API.md`.

It must include:

1. API base URL.
2. Environment setup.
3. Authentication behavior.
4. Cookie and CORS requirements.
5. Every public endpoint.
6. Every admin endpoint.
7. Query parameters.
8. Request body schemas.
9. Response body schemas.
10. Example requests and responses.
11. Validation errors.
12. Status codes.
13. Pagination behavior.
14. Ordering behavior.
15. Filtering behavior.
16. TypeScript interfaces the frontend can copy.
17. Frontend integration examples using `fetch`.
18. Local development instructions.

Also generate:

- OpenAPI/Swagger JSON.
- Swagger UI at `/api/docs`.
- `docs/ADMIN.md` describing how to use the admin panel.
- `README.md` with installation and deployment instructions.
- `.env.example` containing every required variable without real secrets.

Include frontend-ready TypeScript types for:

- `Service`
- `Project`
- `EnquiryInput`
- `ProjectRequestInput`
- `PublicSiteSettings`
- `PaginatedResponse`
- `ApiSuccessResponse`
- `ApiErrorResponse`

## Testing

Add tests for at least:

- Admin login.
- Invalid login.
- Public service listing and ordering.
- Inactive services being excluded.
- Service creation.
- Bulk service reordering.
- Published project listing.
- Draft projects being excluded publicly.
- Project filtering.
- Enquiry validation and creation.
- Project request validation and creation.
- Unauthorized access to admin endpoints.
- Not-found responses.

## Seed data

Create a database seed script containing:

- One administrator from environment variables.
- Several example services.
- Several example projects in different statuses.
- Public site settings.

## Commands

Provide scripts for:

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`
- `npm test`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`
- `npm run admin:dev`
- `npm run admin:build`

## Deliverables

The final result must include:

1. A working Node.js TypeScript REST API.
2. PostgreSQL Prisma schema and migrations.
3. Seed data.
4. Protected admin authentication.
5. A functional admin panel.
6. Public services and projects APIs.
7. Enquiry and project-request APIs.
8. Ordering and filtering support.
9. Markdown API documentation.
10. Swagger documentation.
11. Automated tests.
12. Docker Compose configuration.
13. `.env.example`.
14. Clear setup instructions.

Before finishing:

- Run lint.
- Run tests.
- Run the production build.
- Apply database migrations.
- Confirm the seed script works.
- Confirm all public and admin endpoints match `docs/API.md`.
- Report the files created, commands executed, test results, and any remaining limitations.
