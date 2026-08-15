import { relations } from "drizzle-orm";

import {
  accounts,
  comments,
  communities,
  communityMembers,
  posts,
  reports,
  sessions,
  users,
  verificationTokens,
  votes,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  posts: many(posts),
  comments: many(comments),
  votes: many(votes),
  memberships: many(communityMembers),
  reports: many(reports, { relationName: "report_reporter" }),
  resolvedReports: many(reports, { relationName: "report_resolver" }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const verificationTokensRelations = relations(
  verificationTokens,
  () => ({}),
);

export const communitiesRelations = relations(communities, ({ many, one }) => ({
  owner: one(users, {
    fields: [communities.ownerId],
    references: [users.id],
  }),
  posts: many(posts),
  members: many(communityMembers),
}));

export const communityMembersRelations = relations(
  communityMembers,
  ({ one }) => ({
    community: one(communities, {
      fields: [communityMembers.communityId],
      references: [communities.id],
    }),
    user: one(users, {
      fields: [communityMembers.userId],
      references: [users.id],
    }),
  }),
);

export const postsRelations = relations(posts, ({ many, one }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  votes: many(votes),
}));

export const commentsRelations = relations(comments, ({ many, one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "comment_parent",
  }),
  replies: many(comments, { relationName: "comment_parent" }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "report_reporter",
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
    relationName: "report_resolver",
  }),
}));
