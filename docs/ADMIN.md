# Privion Admin Panel

Run `npm run admin:dev` and open `http://localhost:5173`. Sign in with the administrator credentials configured in `.env`.

## Dashboard

The dashboard shows active services, published and draft projects, new enquiries, and new service requests.

## Services

The service editor manages both catalogue cards and complete public detail pages:

- title, generated or custom slug, tagline, category, and descriptions;
- card and hero imagery with direct Cloudinary upload and preview;
- features, benefits, deliverables, and technology tags;
- starting-price and estimated-timeline guidance;
- structured delivery-process steps and FAQs as validated JSON;
- SEO title and description;
- active/inactive publication state.

Search services locally, drag rows to change public order, archive instead of deleting referenced services, and restore archived records.

## Projects and apps

Use one editor for websites, web apps, mobile apps, desktop apps, platforms, and case studies. It supports:

- Markdown case-study content;
- cover image upload, galleries, and screenshot URLs;
- related services, technology tags, platforms, and features;
- product website, Google Play, and Apple App Store links;
- structured outcome metrics;
- completion date, featured state, and SEO fields;
- draft, publish, unpublish, and archive controls.

The table supports text, status, and content-type filtering.

## Enquiries

Search and filter Contact Us messages. Select a record to inspect every submitted field, reply using its email link, change workflow status, and maintain private notes. Public contact is routed internally through `priviontech@gmail.com`.

## Service requests

The request inbox exposes the complete multi-step discovery brief, including selected services, goals, audience, features, platforms, budget, timing, attachments, contact preference, consent, and custom discovery answers. Reviewers can move it through `NEW`, `REVIEWING`, `CONTACTED`, `ACCEPTED`, `DECLINED`, or `SPAM` and add private notes.

## Cloudinary media

Image fields can upload directly to Cloudinary. The browser sends a multipart file to the protected backend; Cloudinary credentials never reach client code.

`POST /api/v1/admin/media/upload` accepts one `file`, up to 10 MB, in JPG, PNG, WebP, GIF, SVG, or PDF format. The backend uses `CLOUDINARY_URL`, signed preset `CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_FOLDER`, and `CLOUDINARY_SECURE`.

Only administrators can delete an asset through `DELETE /api/v1/admin/media/:publicId`.

## Safety

Publishing makes a project public immediately. Unpublishing returns it to draft. Prefer archival when content may be referenced. Confirm destructive actions, sanitize rendered Markdown in public clients, and never place Cloudinary secrets in the browser.
