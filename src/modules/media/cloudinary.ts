import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/config/env";
import { AppError } from "@/utils/http";

let configured = false;

function configureCloudinary() {
  const required = [
    env.CLOUDINARY_URL,
    env.CLOUDINARY_CLOUD_NAME,
    env.CLOUDINARY_API_KEY,
    env.CLOUDINARY_API_SECRET,
    env.CLOUDINARY_UPLOAD_PRESET,
  ];
  if (required.some((value) => !value)) {
    throw new AppError(
      503,
      "MEDIA_NOT_CONFIGURED",
      "Cloudinary media storage is not fully configured.",
    );
  }
  if (!env.CLOUDINARY_URL!.endsWith(`@${env.CLOUDINARY_CLOUD_NAME}`)) {
    throw new AppError(
      503,
      "MEDIA_CONFIG_INVALID",
      "Cloudinary URL and cloud name do not match.",
    );
  }
  if (!configured) {
    // `true` reads and parses CLOUDINARY_URL. The explicit secure override controls
    // generated delivery URLs while keeping credentials server-side.
    cloudinary.config(true);
    cloudinary.config({ secure: env.CLOUDINARY_SECURE });
    configured = true;
  }
  return cloudinary;
}

export function uploadMedia(
  buffer: Buffer,
  options: { originalName: string; resourceType?: "image" | "raw" | "video" },
) {
  const client = configureCloudinary();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
        asset_folder: env.CLOUDINARY_FOLDER,
        resource_type: options.resourceType ?? "image",
        filename_override: options.originalName,
        use_filename_as_display_name: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(
              502,
              "MEDIA_UPLOAD_FAILED",
              "Cloudinary could not store the uploaded file.",
            ),
          );
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function deleteMedia(publicId: string, resourceType: "image" | "raw" | "video" = "image") {
  const result = await configureCloudinary().uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError(502, "MEDIA_DELETE_FAILED", "Cloudinary could not delete the asset.");
  }
  return result.result;
}
