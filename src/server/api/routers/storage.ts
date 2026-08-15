import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getSignedDownloadUrl, s3 } from "~/server/s3";

const imageType = z.enum([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const storageRouter = createTRPCRouter({
  createImageUpload: protectedProcedure
    .input(
      z.object({
        contentType: imageType,
        extension: z.enum(["avif", "jpg", "jpeg", "png", "webp"]),
      }),
    )
    .mutation(async ({ input }) => {
      const key = `images/${randomUUID()}.${input.extension}`;
      const command = new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: input.contentType,
      });

      return {
        key,
        uploadUrl: await getSignedUrl(s3, command, { expiresIn: 300 }),
      };
    }),
  getSignedDownloadUrl: protectedProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(async ({ input }) => {
      return getSignedDownloadUrl(input.key);
    }),
});
