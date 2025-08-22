This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Project Setup (MongoDB, Admin, Cloudinary)

1) Environment variables (`.env.local`):

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Admin token for simple protected admin endpoints (header x-admin-token)
ADMIN_TOKEN=change-this-strong-token
# Optional: expose same token to client to allow admin UI calls
NEXT_PUBLIC_ADMIN_TOKEN=change-this-strong-token

# Optional Cloudinary for image delivery / future uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET=optional-preset
```

2) Run dev server:

```
npm run dev
```

3) Admin pages (basic CRUD):

- Slides: `/{locale}/admin`
- Brands: `/{locale}/admin/brands`
- Categories: `/{locale}/admin/categories`
- Products: `/{locale}/admin/products`

4) APIs:

- Slides: `GET/POST /api/slides`, `PUT/DELETE /api/slides/[id]`
- Brands: `GET/POST /api/brands`, `PUT/DELETE /api/brands/[id]`
- Categories: `GET/POST /api/categories`, `PUT/DELETE /api/categories/[id]`
- Products: `GET/POST /api/products`, `PUT/DELETE /api/products/[id]`

Authorization for mutating endpoints: send header `x-admin-token: <ADMIN_TOKEN>`.

5) Images:

- Cloudinary delivery is allowed by Next Image (`res.cloudinary.com`).
- For now, paste Cloudinary image URLs directly into the admin forms. A signed upload endpoint can be added later.
