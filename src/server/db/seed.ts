import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { env } from "~/env";
import {
  comments,
  communities,
  communityMembers,
  images,
  posts,
  reports,
  users,
  votes,
} from "./schema";

const sql = neon(env.DATABASE_URL);
const db = drizzle({ client: sql });

const PASSWORD = "Seedpass123!";

const COMMUNITIES: {
  slug: string;
  name: string;
  description: string;
}[] = [
  {
    slug: "reactjs",
    name: "React",
    description:
      "Everything about React — components, hooks, the ecosystem, and best practices.",
  },
  {
    slug: "typescript",
    name: "TypeScript",
    description:
      "TypeScript tips, type gymnastics, and the broader static-typing ecosystem.",
  },
  {
    slug: "javascript",
    name: "JavaScript",
    description:
      "The language of the web — modern JS, syntax, patterns, and tooling.",
  },
  {
    slug: "nextjs",
    name: "Next.js",
    description:
      "The React framework — App Router, Server Components, caching, and deployment.",
  },
  {
    slug: "nodejs",
    name: "Node.js",
    description:
      "Server-side JavaScript — runtimes, streams, workers, and ecosystem libraries.",
  },
  {
    slug: "python",
    name: "Python",
    description: "Python for automation, web, data, and everything in between.",
  },
  {
    slug: "rust",
    name: "Rust",
    description:
      "Systems programming with safety — ownership, traits, async, and cargo.",
  },
  {
    slug: "go",
    name: "Go",
    description:
      "Simple, fast, reliable — goroutines, interfaces, and the standard library.",
  },
  {
    slug: "java",
    name: "Java",
    description:
      "JVM, Spring, and enterprise Java — plus modern Java 17+ features.",
  },
  {
    slug: "dotnet",
    name: ".NET",
    description: "C#, ASP.NET Core, and the .NET ecosystem across platforms.",
  },
  {
    slug: "php",
    name: "PHP",
    description: "PHP 8+, Laravel, and modern web development on the server.",
  },
  {
    slug: "ruby",
    name: "Ruby",
    description:
      "Ruby and Rails — elegant syntax and convention-over-configuration.",
  },
  {
    slug: "swift",
    name: "Swift",
    description:
      "Swift for iOS, macOS, and beyond — SwiftUI, concurrency, and packages.",
  },
  {
    slug: "kotlin",
    name: "Kotlin",
    description: "Kotlin for Android, JVM, and multiplatform development.",
  },
  {
    slug: "flutter",
    name: "Flutter",
    description: "Flutter and Dart — cross-platform UI from a single codebase.",
  },
  {
    slug: "vue",
    name: "Vue.js",
    description: "The progressive framework — composition API, Vite, and Nuxt.",
  },
  {
    slug: "svelte",
    name: "Svelte",
    description: "Compile-time reactivity — Svelte 5, runes, and SvelteKit.",
  },
  {
    slug: "angular",
    name: "Angular",
    description:
      "Angular — signals, standalone components, and enterprise-scale apps.",
  },
  {
    slug: "tailwindcss",
    name: "Tailwind CSS",
    description: "Utility-first CSS — styling, theming, and workflow tips.",
  },
  {
    slug: "css",
    name: "CSS",
    description:
      "Layout, design systems, and modern CSS features like container queries.",
  },
  {
    slug: "html",
    name: "HTML",
    description: "Semantic markup, accessibility, and the web platform itself.",
  },
  {
    slug: "postgresql",
    name: "PostgreSQL",
    description:
      "The world's most advanced open source database — SQL, indexing, and tuning.",
  },
  {
    slug: "mongodb",
    name: "MongoDB",
    description:
      "Document databases, aggregation pipelines, and data modeling.",
  },
  {
    slug: "redis",
    name: "Redis",
    description:
      "In-memory data store — caching, queues, and real-time features.",
  },
  {
    slug: "devops",
    name: "DevOps",
    description: "CI/CD, observability, automation, and platform engineering.",
  },
  {
    slug: "docker",
    name: "Docker",
    description: "Containers, images, compose, and containerized workflows.",
  },
  {
    slug: "kubernetes",
    name: "Kubernetes",
    description: "Orchestration, clusters, Helm, and cloud-native patterns.",
  },
  {
    slug: "aws",
    name: "AWS",
    description:
      "Amazon Web Services — compute, storage, serverless, and architecture.",
  },
  {
    slug: "git",
    name: "Git",
    description:
      "Version control — branching, rebasing, and collaboration workflows.",
  },
  {
    slug: "machinelearning",
    name: "Machine Learning",
    description:
      "ML, LLMs, and AI engineering — models, pipelines, and deployment.",
  },
];

async function main() {
  console.log("Seeding DevsHub database...");

  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(reports);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(votes);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(comments);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(posts);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(communityMembers);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(communities);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(images);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(users);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [alice, bob, carol] = await db
    .insert(users)
    .values([
      {
        name: "Alice Developer",
        email: "alice@devshub.local",
        username: "alice",
        usernameUpdatedAt: new Date(),
        bio: "Frontend engineer. React enthusiast.",
        passwordHash,
      },
      {
        name: "Bob Coder",
        email: "bob@devshub.local",
        username: "bob",
        usernameUpdatedAt: new Date(),
        bio: "Backend & TypeScript developer.",
        passwordHash,
      },
      {
        name: "Carol Engineer",
        email: "carol@devshub.local",
        username: "carol",
        usernameUpdatedAt: new Date(),
        bio: "Systems engineer, tinkerer.",
        passwordHash,
      },
    ])
    .returning();

  const owners = [alice!.id, bob!.id, carol!.id];

  const insertedCommunities = await db
    .insert(communities)
    .values(
      COMMUNITIES.map((community, index) => ({
        ...community,
        ownerId: owners[index % owners.length]!,
      })),
    )
    .returning();

  const membershipValues: {
    communityId: string;
    userId: string;
    role: "owner" | "member";
  }[] = [];

  for (let index = 0; index < insertedCommunities.length; index++) {
    const community = insertedCommunities[index]!;
    const ownerId = owners[index % owners.length]!;

    membershipValues.push({
      communityId: community.id,
      userId: ownerId,
      role: "owner",
    });

    // Vary membership so member counts differ (drives trending order).
    const otherUsers = owners.filter((id) => id !== ownerId);
    const joinCount = index % 2 === 0 ? otherUsers.length : 1;
    for (let i = 0; i < joinCount; i++) {
      membershipValues.push({
        communityId: community.id,
        userId: otherUsers[i]!,
        role: "member",
      });
    }
  }

  await db.insert(communityMembers).values(membershipValues);

  // Sync member counts on communities.
  for (const community of insertedCommunities) {
    const members = membershipValues.filter(
      (m) => m.communityId === community.id,
    );
    await db
      .update(communities)
      .set({ memberCount: members.length })
      .where(eq(communities.id, community.id));
  }

  const usersCount = (await db.select().from(users)).length;
  const communitiesCount = (await db.select().from(communities)).length;
  const membershipsCount = (await db.select().from(communityMembers)).length;
  const postsCount = (await db.select().from(posts)).length;

  console.log(`Seeded:
  users: ${usersCount}
  communities: ${communitiesCount}
  memberships: ${membershipsCount}
  posts: ${postsCount}

Seed login (any user): password = ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
