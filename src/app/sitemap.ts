import type { MetadataRoute } from "next";

import { db } from "~/server/db";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3001";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/policy`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const communities = await db.query.communities.findMany({
    columns: { slug: true, updatedAt: true },
    limit: 1000,
  });
  const communityUrls: MetadataRoute.Sitemap = communities.map((community) => ({
    url: `${APP_URL}/community/${community.slug}`,
    lastModified: community.updatedAt,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  const posts = await db.query.posts.findMany({
    columns: { slug: true, updatedAt: true },
    where: (table, { isNull }) => isNull(table.deletedAt),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 1000,
  });
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${APP_URL}/post/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "hourly" as const,
    priority: 0.7,
  }));

  const users = await db.query.users.findMany({
    columns: { username: true, updatedAt: true },
    where: (table, { isNotNull }) => isNotNull(table.username),
    limit: 1000,
  });
  const userUrls: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${APP_URL}/user/${user.username}`,
    lastModified: user.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  return [...base, ...communityUrls, ...postUrls, ...userUrls];
}
