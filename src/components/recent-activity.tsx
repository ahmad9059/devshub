import Link from "next/link";
import { and, desc, inArray, isNull } from "drizzle-orm";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/server/db";
import { posts } from "~/server/db/schema";

export async function RecentActivity({ userId }: { userId: string }) {
  const [authored, castVotes, authoredComments] = await Promise.all([
    db.query.posts.findMany({
      where: (table, { and: a, eq: e, isNull: n }) =>
        a(e(table.authorId, userId), n(table.deletedAt)),
      columns: { id: true },
    }),
    db.query.votes.findMany({
      where: (table, { and: a, eq: e }) =>
        a(e(table.userId, userId), e(table.targetType, "post")),
      columns: { targetId: true },
    }),
    db.query.comments.findMany({
      where: (table, { eq: e }) => e(table.authorId, userId),
      columns: { postId: true },
    }),
  ]);

  const postIds = new Set<string>();
  authored.forEach((post) => postIds.add(post.id));
  castVotes.forEach((vote) => postIds.add(vote.targetId));
  authoredComments.forEach((comment) => postIds.add(comment.postId));

  if (postIds.size === 0) {
    return null;
  }

  const recentPosts = await db.query.posts.findMany({
    where: and(inArray(posts.id, [...postIds]), isNull(posts.deletedAt)),
    with: { community: true },
    orderBy: [desc(posts.createdAt)],
    limit: 5,
  });

  if (recentPosts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Recent posts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {recentPosts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="hover:bg-muted group/post flex flex-col rounded-md px-2 py-1.5 transition-[background-color,transform] duration-150 active:scale-[0.98]"
          >
            <span className="group-hover/post:text-primary line-clamp-1 text-sm font-medium transition-colors duration-200">
              {post.title}
            </span>
            <span className="text-muted-foreground group-hover/post:text-foreground text-xs transition-colors duration-200">
              d/{post.community.slug}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
