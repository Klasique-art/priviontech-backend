import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("8h"),
    COOKIE_NAME: z.string().default("privion_admin"),
    CORS_ORIGIN: z
      .string()
      .default("http://localhost:3000,http://localhost:5173"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_URL: z.string().optional(),
    CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
    CLOUDINARY_FOLDER: z.string().default("privion"),
    CLOUDINARY_SECURE: z
      .string()
      .default("true")
      .transform((value) => value === "true"),
  })
  .superRefine(({ DATABASE_URL, NODE_ENV }, context) => {
    if (
      NODE_ENV === "production" &&
      /(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(DATABASE_URL)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message:
          "Production DATABASE_URL cannot point to localhost. Use the managed PostgreSQL private/internal connection string.",
      });
    }
  });

export const env = schema.parse(process.env);
