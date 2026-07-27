# Privion Public API

Frontend-only public API contract. No account, cookie, access token, or authentication is required.

```text
Development base URL: http://localhost:8000/api/v1
Public contact email: priviontech@gmail.com
Content-Type: application/json
```

## Response conventions

Success:

```json
{ "success": true, "data": {} }
```

Paginated success:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 12, "total": 30, "totalPages": 3 }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "fields": { "email": "Enter a valid email address." }
  }
}
```

Status codes: `200` success, `201` created, `404` not found, `422` invalid input, `429` rate limited, `500` unexpected error, and `503` degraded health.

## Endpoint index

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | API/database health |
| `GET` | `/settings` | Public company and SEO settings |
| `GET` | `/services` | Searchable service catalogue |
| `GET` | `/services/:slug` | Full service detail page |
| `GET` | `/projects` | Searchable projects/case studies |
| `GET` | `/projects/:slug` | Full project detail page |
| `POST` | `/enquiries` | Contact Us submission |
| `POST` | `/service-requests` | Detailed service/project brief |
| `POST` | `/project-requests` | Backward-compatible alias for service requests |

## `GET /health`

No query or payload.

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "up",
    "timestamp": "2026-07-27T17:30:00.000Z"
  }
}
```

## `GET /settings`

No query or payload.

Response:

```json
{
  "success": true,
  "data": {
    "companyName": "Privion Technologies",
    "contactEmail": "priviontech@gmail.com",
    "contactPhone": null,
    "address": null,
    "linkedInUrl": null,
    "defaultSeoTitle": "Privion Technologies",
    "defaultSeoDescription": "Technology services built around your business.",
    "updatedAt": "2026-07-27T17:30:00.000Z"
  }
}
```

## `GET /services`

Returns active services as a paginated catalogue. The frontend can use the summary fields for cards and fetch the slug endpoint when a visitor opens a service.

Query parameters:

| Name | Type | Default | Behavior |
|---|---|---:|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `12` | Page size, 1–100 |
| `search` | string | — | Searches title, summary, and description |
| `category` | string | — | Case-insensitive exact category |
| `technology` | string | — | Exact technology tag |
| `sort` | enum | `order` | `order`, `title`, `newest`, or `oldest` |

Example request:

```http
GET /services?page=1&limit=12&search=mobile&category=Software%20Development&technology=React%20Native&sort=title
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "3be3f190-1ef5-4b0d-b76c-8d8794990130",
      "title": "Mobile App Development",
      "slug": "mobile-app-development",
      "tagline": "Useful mobile products people return to",
      "category": "Software Development",
      "shortDescription": "End-to-end iOS and Android product design and engineering.",
      "icon": "smartphone",
      "imageUrl": "https://cdn.example.com/services/mobile-card.webp",
      "heroImageUrl": "https://cdn.example.com/services/mobile-hero.webp",
      "features": ["iOS and Android", "Push notifications", "Offline-first workflows"],
      "benefits": ["One product team", "Shared cross-platform foundations"],
      "technologies": ["React Native", "Flutter", "Swift", "Kotlin"],
      "startingPrice": "Custom quote",
      "estimatedTimeline": "10–24 weeks",
      "order": 1,
      "updatedAt": "2026-07-27T17:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

## `GET /services/:slug`

Path parameter: `slug` is the URL-safe value returned by `/services`.

Example:

```http
GET /services/mobile-app-development
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "3be3f190-1ef5-4b0d-b76c-8d8794990130",
    "title": "Mobile App Development",
    "slug": "mobile-app-development",
    "tagline": "Useful mobile products people return to",
    "category": "Software Development",
    "shortDescription": "End-to-end iOS and Android product design and engineering.",
    "description": "# Mobile App Development\n\nFrom validated concept through store delivery.",
    "icon": "smartphone",
    "imageUrl": "https://cdn.example.com/services/mobile-card.webp",
    "heroImageUrl": "https://cdn.example.com/services/mobile-hero.webp",
    "features": ["iOS and Android", "Push notifications", "Offline-first workflows"],
    "benefits": ["One product team", "Release-ready quality"],
    "deliverables": ["Product roadmap", "Interactive prototype", "Mobile application", "Backend APIs", "Store release package"],
    "technologies": ["React Native", "Flutter", "Swift", "Kotlin", "Node.js"],
    "process": [
      { "step": 1, "title": "Discovery", "description": "Validate users, outcomes, scope and constraints.", "duration": "1–2 weeks" },
      { "step": 2, "title": "Product design", "description": "Map flows and validate an interactive prototype.", "duration": "2–4 weeks" },
      { "step": 3, "title": "Engineering", "description": "Build tested application increments and APIs.", "duration": "6–16 weeks" },
      { "step": 4, "title": "Release", "description": "Store submission, monitoring and handover.", "duration": "1–2 weeks" }
    ],
    "faqs": [
      { "question": "Do you publish to both stores?", "answer": "Yes. Store preparation and submission support can be included." }
    ],
    "startingPrice": "Custom quote",
    "estimatedTimeline": "10–24 weeks",
    "order": 1,
    "seoTitle": "Mobile App Development | Privion Technologies",
    "seoDescription": "Product strategy, design and mobile engineering.",
    "createdAt": "2026-07-27T17:30:00.000Z",
    "updatedAt": "2026-07-27T17:30:00.000Z"
  }
}
```

Inactive or missing services return `404`.

## `GET /projects`

Returns published websites, applications, platforms and case studies.

Query parameters:

| Name | Type | Default | Behavior |
|---|---|---:|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `12` | Page size, 1–100 |
| `search` | string | — | Searches title, summary and long description |
| `service` | string | — | Related service slug |
| `technology` | string | — | Exact technology tag |
| `platform` | string | — | Exact platform, e.g. `Web`, `iOS`, `Android` |
| `kind` | enum | — | `WEBSITE`, `WEB_APP`, `MOBILE_APP`, `DESKTOP_APP`, `PLATFORM`, `CASE_STUDY` |
| `featured` | boolean string | — | `true` or `false` |
| `sort` | enum | `order` | `order`, `newest`, `oldest`, or `title` |

Example:

```http
GET /projects?page=1&limit=9&service=web-development&technology=TypeScript&featured=true&sort=newest
```

Apps are projects and use the same endpoint:

```http
GET /projects?kind=MOBILE_APP&platform=Android&sort=newest
GET /projects?kind=WEB_APP&featured=true
GET /projects?kind=DESKTOP_APP&platform=Windows
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "84e98172-73ce-4538-b2fc-ad92df21c990",
      "title": "Commerce Platform",
      "slug": "commerce-platform",
      "kind": "WEB_APP",
      "clientName": "Retail Client",
      "summary": "A scalable retail experience connecting discovery, checkout and fulfillment.",
      "content": "# Commerce Platform\n\nA complete case study in Markdown.",
      "coverImageUrl": "https://cdn.example.com/projects/commerce-cover.webp",
      "galleryImages": ["https://cdn.example.com/projects/commerce-gallery-1.webp"],
      "screenshots": ["https://cdn.example.com/projects/commerce-dashboard.webp"],
      "technologies": ["TypeScript", "React", "PostgreSQL"],
      "platforms": ["Web"],
      "features": ["Product discovery", "Secure checkout", "Operations dashboard"],
      "projectUrl": "https://project.example.com",
      "playStoreUrl": null,
      "appStoreUrl": null,
      "results": [
        { "label": "Performance", "value": "90+ Lighthouse", "description": "Across critical customer journeys." },
        { "label": "Conversion", "value": "+28%", "description": "After the new checkout launch." }
      ],
      "completionDate": "2026-05-01T00:00:00.000Z",
      "order": 0,
      "status": "PUBLISHED",
      "isFeatured": true,
      "publishedAt": "2026-06-01T10:00:00.000Z",
      "services": [
        {
          "id": "3be3f190-1ef5-4b0d-b76c-8d8794990130",
          "title": "Web Development",
          "slug": "web-development",
          "shortDescription": "Strategy and engineering for modern websites."
        }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 9, "total": 1, "totalPages": 1 }
}
```

## `GET /projects/:slug`

No payload. Returns the same complete project shape shown above, including related services, media, features, results, website link, and store links where applicable.

```http
GET /projects/commerce-platform
```

Draft, archived, and missing records return `404`. `content` is Markdown; sanitize rendered HTML.

For app projects, render only the links that are present:

- `projectUrl` opens the project or product website.
- `playStoreUrl` opens its Google Play listing.
- `appStoreUrl` opens its Apple App Store listing.

## `POST /enquiries`

Contact Us form. Privion receives and handles the enquiry internally at `priviontech@gmail.com`.

Payload:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+354 555 0100",
  "company": "Example Company",
  "subject": "Partnership enquiry",
  "message": "We would like to discuss a technology partnership.",
  "website": ""
}
```

Required: `name`, valid `email`, `subject`, `message`. Optional: `phone`, `company`. `website` is a honeypot and must be absent or empty.

Response (`201`):

```json
{
  "success": true,
  "data": {
    "id": "d80d782f-57ad-4ed9-b8f1-4248c2cc2abe",
    "createdAt": "2026-07-27T17:30:00.000Z"
  }
}
```

## Service request flow

The frontend should present this as four deliberate steps. Keep the values in frontend state, allow Back/Next navigation, show a final review screen, and call the API only after explicit consent.

1. **Contact** — name, email, phone, company, preferred contact method.
2. **Service and goals** — selected service IDs, project type, summary, business goals, target audience.
3. **Scope and constraints** — features, platforms, references, budget, timing, attachments, discovery answers.
4. **Review and consent** — display the complete brief, accept contact consent, then submit.

Do not present a one-click request button as a completed request. The first click should open Step 1.

## `POST /service-requests`

Preferred endpoint for the multi-step form.

Payload:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+354 555 0100",
  "company": "Example Company",
  "contactPreference": "VIDEO_CALL",
  "serviceIds": [
    "3be3f190-1ef5-4b0d-b76c-8d8794990130",
    "b15e10cd-9f7e-4d13-9b25-093977a536a8"
  ],
  "projectType": "Customer mobile application",
  "projectSummary": "A self-service application for our customers.",
  "goals": [
    "Reduce support requests",
    "Give customers real-time order information",
    "Improve repeat engagement"
  ],
  "targetAudience": "Existing customers in Iceland and Northern Europe, primarily using iOS and Android.",
  "requiredFeatures": [
    "Email and social sign-in",
    "Order tracking",
    "Push notifications",
    "In-app support"
  ],
  "preferredPlatforms": ["iOS", "Android"],
  "inspirationUrls": [
    "https://example.com/reference-product"
  ],
  "budgetRange": "25k–50k",
  "budgetMin": 25000,
  "budgetMax": 50000,
  "budgetCurrency": "USD",
  "desiredStartDate": "2026-10-01",
  "timeline": "Targeting an initial release within five months.",
  "attachmentUrls": [
    "https://example.com/files/product-brief.pdf"
  ],
  "discoveryAnswers": {
    "existingBackend": true,
    "monthlyActiveUsers": 12000,
    "complianceNeeds": ["GDPR"],
    "successMetric": "30% fewer order-status support tickets"
  },
  "consentToContact": true,
  "source": "website-service-page",
  "website": ""
}
```

Validation:

- `serviceIds`: 1–20 unique active service UUIDs
- `goals`: 1–20 meaningful goals
- `targetAudience` and `projectSummary`: required
- `contactPreference`: `EMAIL`, `PHONE`, `WHATSAPP`, or `VIDEO_CALL`
- `budgetMin`/`budgetMax`: non-negative integers; maximum cannot be below minimum
- `budgetCurrency`: three-letter currency code
- `inspirationUrls` and `attachmentUrls`: valid absolute URLs
- `consentToContact`: must be `true`
- `website`: absent or empty

Response (`201`):

```json
{
  "success": true,
  "data": {
    "id": "8f3e1415-e993-49b6-8968-533691f3bd42",
    "status": "NEW",
    "createdAt": "2026-07-27T17:30:00.000Z",
    "nextSteps": [
      { "step": 1, "title": "Review", "description": "Our team reviews your brief." },
      { "step": 2, "title": "Discovery", "description": "We arrange a discovery call using your preferred contact method." },
      { "step": 3, "title": "Proposal", "description": "You receive scope, milestones, timing and pricing." }
    ]
  }
}
```

`POST /project-requests` accepts the same payload and remains available for older frontend integrations.

## Frontend fetch helper

```ts
type ApiError = {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};

export async function publicApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`http://localhost:8000/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result.data as T;
}
```

Canonical copyable interfaces are maintained in [`src/types/api.ts`](../src/types/api.ts).
