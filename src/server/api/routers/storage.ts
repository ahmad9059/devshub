import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { s3 } from "~/server/s3";

const imageType = z.enum([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const storageRouter = createTRPCRouter({
  createImageUpload: publicProcedure
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
        ServerSideEncryption: "AES256",
      });

      return {
        key,
        uploadUrl: await getSignedUrl(s3, command, { expiresIn: 300 }),
      };
    }),
});
