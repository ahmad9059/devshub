import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, sql as drizzleSql } from "drizzle-orm";

import { env } from "~/env";
import * as relations from "./relations";
import * as schema from "./schema";

const neonClient = neon(env.DATABASE_URL);
const db = drizzle({
  client: neonClient,
  schema: { ...schema, ...relations },
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Deterministic pseudo-random so re-runs produce identical data.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const POSTS: [slug: string, title: string, body: string][] = [
  // reactjs
  [
    "reactjs",
    "Why does my component remount every time the parent re-renders?",
    "I keep hitting a case where a child component loses its local state on every parent render. The docs mention keys, but it feels like there's a deeper rule about element identity I'm missing. What mental model do you use to predict when React will preserve or destroy a component instance?",
  ],
  [
    "reactjs",
    "useEffect with a ref dependency: is it ever actually safe?",
    "I've seen people put a ref in a useEffect dependency array and pretend it works. My understanding is refs are stable by contract, so it's a no-op — but does that make it safe or just silently wrong? What do you do when an effect needs the latest ref value AND needs to react to other deps?",
  ],
  [
    "reactjs",
    "Is the React Compiler ready for production adoption this year?",
    "The compiler promises to remove the need for manual memoization, but I'm wary of subtle behavior changes in complex codebases. For teams that already have well-tuned memo boundaries, is migrating to the compiler a net win or just another tool to debug?",
  ],
  [
    "reactjs",
    "What's the cleanest way to avoid context re-renders in large apps?",
    "My app has a global auth context and the whole tree re-renders on every token refresh. I know splitting providers and memoizing consumers helps, but at some point it feels like I'm fighting the architecture. What pattern actually scales without turning everything into state libraries?",
  ],
  [
    "reactjs",
    "When would you still choose class components over function components today?",
    "With error boundaries still requiring classes, there are a couple of places I keep classes around. Are there other legitimate reasons left — or is it pure legacy at this point?",
  ],
  [
    "reactjs",
    "How do you handle optimistic updates when your mutations are Server Actions?",
    "useOptimistic gives me the optimistic value but wiring it to real form submissions with progressive enhancement feels awkward. Do you keep a hybrid approach (client mutations for optimistic paths, actions for forms) or push everything through actions?",
  ],
  // typescript
  [
    "typescript",
    "How do you type a function that returns different types based on its arguments?",
    "Function overloading works, but the implementation signature often ends up as a loose union that defeats the purpose. What's your go-to pattern for truly discriminating return types — overloads, generics with conditional types, or something else?",
  ],
  [
    "typescript",
    "Is `any` ever acceptable in a codebase with strict mode?",
    "I get the purity argument, but sometimes a third-party library has types so broken that `any` is the pragmatic choice. Where do you personally draw the line between pragmatism and type safety?",
  ],
  [
    "typescript",
    "What's the cleanest pattern for discriminated unions with async results?",
    "I keep writing `{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; message: string }` by hand. Is there a utility type approach people use to avoid the boilerplate while keeping exhaustiveness checks?",
  ],
  [
    "typescript",
    "Why does Object.entries() lose type safety and how do you work around it?",
    "Object.entries always returns [string, T][] even for a narrow object type. I've seen assertion helpers and generic wrappers, but they all feel a bit hacky. What's your preferred solution?",
  ],
  [
    "typescript",
    "Should verbatimModuleSyntax be on? What actually breaks?",
    "I enabled it in a new project and suddenly a few imports needed `type` modifiers. It felt pedantic at first, but the bundling benefits sound real. Do you keep it enabled as a rule?",
  ],
  [
    "typescript",
    "How do you type an event map for a custom event emitter?",
    "I want `emitter.on('user.created', (user: User) => ...)` to be fully typed with event-name-to-handler mapping. I've seen patterns with mapped types, but nothing that handles both on/off/emit cleanly. What does your implementation look like?",
  ],
  // javascript
  [
    "javascript",
    "Is the null vs undefined debate actually settled now?",
    "Some style guides say 'never use null', others say undefined is a bug-prone default. With optional chaining and nullish coalescing everywhere, does it still matter which one you use for missing values?",
  ],
  [
    "javascript",
    "For await...of vs Promise.all: how do you actually process streams correctly?",
    "For-await processes items sequentially and Promise.all runs everything at once — but for a large dataset with backpressure concerns, neither feels exactly right. What's your practical approach to bounded concurrency over an async iterable?",
  ],
  [
    "javascript",
    "Why do people still reach for lodash in 2026?",
    "Array.prototype methods and object spread cover most cases now, yet lodash still shows up in package.json everywhere. Is it inertia, the _.get path safety, or the collection-style API — what's your real reason for keeping it?",
  ],
  [
    "javascript",
    "What's the cleanest way to deep clone an object in modern JS?",
    "structuredClone handles most cases but trips on functions and class instances. JSON round-trip loses types silently. For data that's 'plain enough', which approach do you trust in production?",
  ],
  [
    "javascript",
    "Structured clone vs JSON clone: when should you actually use each?",
    "I understand structuredClone is faster and preserves more types, but it also throws on functions and DOM nodes. For a serialization layer shared with a server, JSON still feels safer. Is there a rule of thumb you use?",
  ],
  [
    "javascript",
    "How do you handle BigInt values in APIs that only speak JSON?",
    "JSON.stringify throws on BigInt, and parsing decimal strings is lossy. I've seen libraries that serialize BigInts as tagged strings. What's the least surprising convention for cross-language APIs?",
  ],
  // nextjs
  [
    "nextjs",
    "Server Components vs client components: where's the line for forms?",
    "Forms need interactivity, but the validation and submission logic feels serverish. I've been splitting the form into a client shell with server actions for handling. Is that the accepted mental model now, or are there patterns I'm missing?",
  ],
  [
    "nextjs",
    "Why is my on-demand revalidation not firing with ISR?",
    "I call revalidatePath from a webhook and the page still serves stale content. The docs mention that on-demand revalidation can race with in-flight renders. What's the reliable way to invalidate a dynamic route without a full redeploy?",
  ],
  [
    "nextjs",
    "How do you do optimistic UI when you're exclusively using Server Actions?",
    "useOptimistic is built for actions, but combining it with redirect-based flows and progressive enhancement leaves gaps. For a comment box that should feel instant, do you break the purity and use a client mutation, or stick with actions?",
  ],
  [
    "nextjs",
    "What's the recommended way to do feature flags in Next.js App Router?",
    "Middleware flags affect server components and routes, but client components need the flag too. I'm seeing a split between middleware-based and provider-based flagging. How do you keep one source of truth?",
  ],
  [
    "nextjs",
    "Should next/image be used for user-uploaded images on a private bucket?",
    "The image optimizer needs the origin to be allowlisted, and private presigned URLs add another layer. Is it worth configuring, or do you just serve user images through a plain img tag with sizing done client-side?",
  ],
  [
    "nextjs",
    "What's the tradeoff of force-dynamic vs ISR for a community feed?",
    "A feed with votes and comments needs freshness, but force-dynamic kills caching on every page. For a moderately-traffic community app, is ISR with short revalidate intervals actually a better tradeoff?",
  ],
  // nodejs
  [
    "nodejs",
    "Worker threads vs child processes: how do you decide for CPU-bound work?",
    "Both isolate work, but the memory sharing of worker threads and the process isolation of child processes feel like different tradeoffs. For image processing and JSON parsing at scale, what's your decision process?",
  ],
  [
    "nodejs",
    "Is node:test good enough to replace Jest or Vitest now?",
    "The built-in test runner has gotten surprisingly capable with mocking and coverage. But the ecosystem of matchers and watch modes still lags. What would make you switch a real project over?",
  ],
  [
    "nodejs",
    "What's the safest way to handle unhandled promise rejections in production?",
    "process.on('unhandledRejection') catches them, but the process state may already be compromised. Some people crash and restart, others log and continue. What's the least dangerous policy for a long-running service?",
  ],
  [
    "nodejs",
    "How do you prevent memory leaks from setInterval in long-running processes?",
    "If the callback holds a reference to a growing structure, the interval keeps it alive forever. What's your standard pattern for intervals that touch request-scoped data?",
  ],
  [
    "nodejs",
    "What's your process for debugging high-memory Node services in production?",
    "Heap snapshots are heavy and can crash the process if taken wrong. I've used --inspect with a pause, but that means downtime. How do you profile memory without making the problem worse?",
  ],
  [
    "nodejs",
    "Streaming JSON parsing: best library or hand-rolled approach?",
    "Parsing a huge NDJSON file line by line is fine, but deeply nested single-document JSON streaming is awkward. Are the streaming parser libraries mature enough now, or do people still preprocess?",
  ],
  // python
  [
    "python",
    "Pydantic v2 models vs dataclasses: when do you reach for each?",
    "Pydantic brings validation and serialization but has a compile-time cost and a heavier mental model. For internal data structures with no external boundary, dataclasses feel cleaner. Is that the right split?",
  ],
  [
    "python",
    "Async generators vs streaming responses in FastAPI: any gotchas?",
    "Returning an async generator from an endpoint works, but exceptions inside the generator don't map to HTTP errors the way I expect. What patterns do people use for robust streaming endpoints?",
  ],
  [
    "python",
    "How do you structure a Python project for maintainability?",
    "src layout vs flat layout, where config lives, how to handle the 'local imports are broken' problem. For a service that's growing, what structure prevents the classic Python import pain?",
  ],
  [
    "python",
    "Type hints everywhere or just at API boundaries?",
    "Fully annotating a codebase with generics and overloads takes real time. For an internal tool that changes often, do you annotate everything or just the public surface?",
  ],
  [
    "python",
    "What's the current best practice for background tasks in FastAPI?",
    "BackgroundTasks only works within the request lifecycle. For jobs that must survive process restarts, people reach for Celery, Dramatiq, or ARQ. What's your threshold for adding a task queue?",
  ],
  [
    "python",
    "uv vs poetry vs pip-tools in 2026?",
    "uv is fast and drops the venv management overhead, but poetry's lockfile ecosystem is more established. For a team project, what actually matters — speed of resolution or the workflow everyone already knows?",
  ],
  // rust
  [
    "rust",
    "Lifetimes are still the hardest part for me — what mental model finally clicked?",
    "I understand the rules but struggle to reason about complex nested references. Was there a particular way of thinking about 'borrows as scoped permissions' that made the compiler errors feel obvious?",
  ],
  [
    "rust",
    "How do you decide between an enum state machine and trait objects?",
    "State machines via enums give exhaustive matching and no dynamic dispatch, but trait objects are easier to extend. For a connection handler that has many states, which do you reach for first?",
  ],
  [
    "rust",
    "What's the idiomatic way to handle errors in library code vs binary code?",
    "Libraries want thiserror-style typed errors; binaries want anyhow for context. I keep crossing the boundary awkwardly with conversion impls. Is there a cleaner seam between the two?",
  ],
  [
    "rust",
    "async_trait vs RPITIT — what do you reach for now?",
    "Return-position impl trait in traits stabilized, but dyn compatibility and Send bounds still complicate things. For a codebase with a few async trait methods, which approach is less painful in practice?",
  ],
  [
    "rust",
    "When does Box<dyn Trait> make more sense than generics?",
    "Generics monomorphize but bloat compile times and binary size; trait objects add a pointer indirection. For a plugin-like architecture, is the tradeoff as clear as people say?",
  ],
  [
    "rust",
    "Any practical tips for reducing compile times in large workspaces?",
    "sccache, splitting crates, avoiding generics in hot paths — what actually moved the needle for you? I'm at 4+ minute builds and incremental rebuilds are starting to hurt the iteration loop.",
  ],
  // go
  [
    "go",
    "Errors as values vs panic/recover — where's the line?",
    "Go's philosophy is explicit errors, but some failure modes are truly unrecoverable. When do you deliberately choose panic/recover, and how do you make the decision defensible in review?",
  ],
  [
    "go",
    "Context cancellation: how do you propagate it cleanly through third-party libs?",
    "Some libraries don't accept a context, so cancellation silently stops at the boundary. Do you wrap them with goroutine checks, or accept the leak and document it?",
  ],
  [
    "go",
    "Generics: what's a real-world case where they made your code simpler?",
    "Most Go generics examples are toy containers. Have you used them in production in a way that genuinely reduced duplication without hurting readability?",
  ],
  [
    "go",
    "How do you structure handlers vs using a framework like chi or echo?",
    "Hand-rolled mux with middleware chaining is idiomatic, but frameworks add convenience. For a service with auth, validation, and versioned routes, does the stdlib approach really stay manageable?",
  ],
  [
    "go",
    "What's your approach to graceful shutdown with multiple goroutines?",
    "sync.WaitGroup for the worker pool, context for the HTTP server, and a signal channel — I've got the pieces but they compose awkwardly. Is there a canonical pattern for clean shutdown with partial work?",
  ],
  [
    "go",
    "Interface satisfaction by accident — do you add explicit compile-time checks?",
    "A type can satisfy an interface without declaring it, which makes intent unclear. I've started adding `var _ Interface = (*Type)(nil)` assertions. Is that still the accepted practice?",
  ],
  // java
  [
    "java",
    "Records + sealed interfaces: is the old Lombok boilerplate finally dead?",
    "Records cover immutable data and sealed hierarchies cover exhaustiveness. I still see Lombok in codebases 'for the builders'. Have you fully migrated, and what did you do about the builder pattern?",
  ],
  [
    "java",
    "Virtual threads in production: what were the real gotchas you hit?",
    "I've read the docs and the pinning warnings. What actually surprised you — synchronized blocks pinning, thread-local abuse, or interaction with blocking libraries?",
  ],
  [
    "java",
    "What's the current consensus on JPA vs JDBC for new services?",
    "JPA productivity vs SQL control is an old debate, but with records, jOOQ, and modern JDBC, the calculus changed. What do you actually start a new service with now?",
  ],
  [
    "java",
    "How do you handle DTO mapping without pulling in 15 libraries?",
    "MapStruct generates the boilerplate, ModelMapper reflects at runtime, and hand-mapping is verbose. For a clean architecture with strict layer separation, what's the least painful approach?",
  ],
  [
    "java",
    "GraalVM native image vs JIT for a latency-sensitive API?",
    "Cold start wins are real, but reflection config and slower peak throughput are the tradeoffs. For a small API that sleeps between requests, is native image actually worth it?",
  ],
  [
    "java",
    "Streams vs for loops: does readability actually improve with the functional style?",
    "I find multi-step stream pipelines harder to debug than loops with clear comments. But the team standard is streams everywhere. Am I the only one who finds long pipelines harder to read?",
  ],
  // dotnet
  [
    "dotnet",
    "Minimal APIs vs controllers in 2026 — has the debate settled?",
    "Minimal APIs feel great for prototypes but the team keeps reaching for controllers for structure. With route groups and filters maturing, is there a real reason left to choose controllers?",
  ],
  [
    "dotnet",
    "What's your approach to handling cancellation in async endpoints?",
    "Passing the HttpContext.RequestAborted token through every layer is noisy, and skipping it risks canceled writes. How do you thread cancellation through services cleanly?",
  ],
  [
    "dotnet",
    "EF Core migrations in production: your rollout strategy?",
    "Automatic ApplyMigrations at startup is convenient but scary for lock-heavy tables. Do you run migrations as a deploy step, or trust EF's startup migration?",
  ],
  [
    "dotnet",
    "Source generators: what are you actually using them for?",
    "Beyond the built-in ones, I've seen generators for DI registration and JSON sources. Have you written a custom generator that saved real time, or is it mostly a novelty?",
  ],
  [
    "dotnet",
    "TimeProvider abstraction — do you inject it for testability?",
    "DateTime.Now in tests is a known smell, and TimeProvider is the official fix. But it threads through every layer. Is the ceremony worth it for code that doesn't do much time math?",
  ],
  [
    "dotnet",
    "How do you validate config at startup without making the app fragile?",
    "Options validation with IValidateOptions catches misconfig early, but throwing at startup takes the whole app down. Do you fail fast, or degrade gracefully with warnings?",
  ],
  // flutter
  [
    "flutter",
    "Riverpod vs Bloc in 2026: what makes you pick one over the other?",
    "Riverpod is less boilerplate but Bloc has clearer event traces for debugging. For a team that values explicit state transitions, is Bloc still the right default?",
  ],
  [
    "flutter",
    "How do you handle app state that needs to survive process death?",
    "The OS kills backgrounded apps, and restoring UI state requires persisted storage + rehydration. Do you rely on state restoration APIs or serialize your own app state?",
  ],
  [
    "flutter",
    "Impeller: have you seen real rendering regressions in production?",
    "The Skia-to-Impeller switch promised consistent rendering, but I've seen reports of shader and text issues. On iOS devices, has it been smooth for you?",
  ],
  [
    "flutter",
    "What's your widget-testing strategy for a large codebase?",
    "Golden tests are brittle and unit tests miss widget composition bugs. For a growing app, what balance of widget tests vs integration tests actually caught bugs for you?",
  ],
  [
    "flutter",
    "When do you actually need flutter_rust_bridge for performance?",
    "Rust in Flutter is tempting for CPU-bound work, but FFI adds complexity. For real-world apps, what workload justified that stack?",
  ],
  [
    "flutter",
    "State restoration: is it worth the complexity for your app?",
    "RestorableState sounds great until you're wiring every scroll position and form field. Do you implement it selectively, or skip it for most screens?",
  ],
  // vue
  [
    "vue",
    "Composition API vs Options API: how do you introduce Vue 3 to a Vue 2 team?",
    "The migration guides push Composition API, but Options API is familiar and less intimidating. For a team that knows Vue 2 well, what's the least disruptive way to onboard?",
  ],
  [
    "vue",
    "Pinia vs Vuex: what pushed you to migrate?",
    "Vuex 4 works fine but Pinia's TypeScript support and setup-style stores are cleaner. What was the moment you actually decided the migration was worth the churn?",
  ],
  [
    "vue",
    "What's the cleanest pattern for debounced search with watchers?",
    "Watch + setTimeout + cleanup is the classic approach, but it gets messy with query param sync. Is there a composable pattern people agree on now?",
  ],
  [
    "vue",
    "Vapor or not: do you use the vapor compiler in production?",
    "Vapor mode drops the virtual DOM for better memory and startup. The compiler caveats scare me for complex templates. Has anyone shipped real apps with it?",
  ],
  [
    "vue",
    "How do you handle SSR hydration mismatch errors in Nuxt?",
    "Date formatting and random values always differ between server and client. Do you use ClientOnly wrappers, or is there a cleaner hydration strategy?",
  ],
  [
    "vue",
    "v-model with custom components: any pattern that clicks for you?",
    "The modelValue/update:modelValue dance is simple, but chaining v-model through wrapper components gets verbose. How do you structure composable form fields?",
  ],
  // svelte
  [
    "svelte",
    "Runes vs legacy reactivity: is there any reason to stay on legacy?",
    "Runes unify reactivity across components and files, but the migration touches everything. For a stable codebase, is there a real advantage to staying on legacy until forced?",
  ],
  [
    "svelte",
    "What's your biggest SvelteKit gotcha that wasn't in the docs?",
    "For me it was form actions + validation interplay, and how load functions re-run after actions. What surprised you in production that the docs glossed over?",
  ],
  [
    "svelte",
    "How do you test Svelte 5 components — vitest + testing-library?",
    "Svelte 5's runes made some testing patterns obsolete. What's your testing setup that actually works reliably with Svelte 5?",
  ],
  [
    "svelte",
    "When do you reach for $derived vs computing values at runtime?",
    "$derived memoizes lazily, but the syntax adds noise for trivial computations. Where's the line where the rune earns its keep?",
  ],
  [
    "svelte",
    "SvelteKit adapter-node vs adapter-vercel: what made you choose?",
    "Adapter-node is portable but needs a server; adapter-vercel is zero-ops but locks you in. For a small project without infra experience, which would you pick?",
  ],
  [
    "svelte",
    "Transitions in Svelte 5: what's changed that surprised you?",
    "The transition system got reworked with the motion module. Have you noticed differences in how transitions compose with keyed each blocks in v5?",
  ],
  // tailwindcss
  [
    "tailwindcss",
    "v4 CSS-first config: how did you migrate your design tokens?",
    "Moving from tailwind.config.js to @theme in CSS changes how tokens are defined and referenced. What was the trickiest part of your migration, and was it worth it?",
  ],
  [
    "tailwindcss",
    "Do you define custom utilities or push everything through @apply?",
    "@apply keeps templates clean but can bloat the CSS with repeated declarations. With v4's custom utilities in CSS, what's your composition strategy?",
  ],
  [
    "tailwindcss",
    "How do you handle component libraries that conflict with Tailwind preflight?",
    "Preflight resets often fight with library CSS (like shadcn or MUI). Do you scope preflight, override with base layer, or just accept the conflicts?",
  ],
  [
    "tailwindcss",
    "What's your strategy for dark mode with CSS variables?",
    "Class-based dark mode with CSS variable tokens is the common approach now. How do you structure the token system so components don't each need dark: variants?",
  ],
  [
    "tailwindcss",
    "How do you avoid class-name hell on large projects?",
    "Long utility chains in templates get unreadable, and extracting components too early creates abstractions. What's your pragmatic balance?",
  ],
  [
    "tailwindcss",
    "Container queries in Tailwind: are you using them in production?",
    "The @container utilities exist now, but browser support and pattern familiarity lag. Have you actually shipped container-query-based responsive components?",
  ],
  // postgresql
  [
    "postgresql",
    "How do you index for a LIKE '%pattern%' search without going full-text?",
    "Leading-wildcard LIKE can't use a btree. trigram indexes help, but full-text search changes semantics. For a simple contains-filter, what's the pragmatic choice?",
  ],
  [
    "postgresql",
    "What's your backup/recovery drill for a single-node Postgres?",
    "pg_dump daily plus WAL archiving is the textbook answer, but restore drills are rare. What's a realistic backup strategy for a small team without dedicated DBA time?",
  ],
  [
    "postgresql",
    "PgBouncer vs pooling inside the serverless driver — what are the tradeoffs?",
    "Serverless drivers pool connections in the edge, while PgBouncer sits in front of a classic pool. For an app on Neon or Supabase, is PgBouncer even necessary?",
  ],
  [
    "postgresql",
    "When should you reach for partitioning vs plain indexes?",
    "Partitioning adds query-plan complexity, but archiving old data becomes trivial. For a table with 100M+ rows and time-based access patterns, when do you commit to it?",
  ],
  [
    "postgresql",
    "How do you handle schema migrations that lock a hot table?",
    "Adding a column with a default rewrites the table and locks it. I've used the NOT VALID constraint trick, but it's a lot of steps. Is there a simpler safe path?",
  ],
  [
    "postgresql",
    "What's the practical difference between jsonb and hstore today?",
    "Hstore is simpler and smaller for flat key-value data, but jsonb supports nesting and indexes better. With modern Postgres versions, is hstore ever the right choice for new code?",
  ],
  // mongodb
  [
    "mongodb",
    "Schema design: embedding vs references for a social feed — how do you model it?",
    "Embedding comments in a post document makes reads cheap but grows documents unboundedly. For a Reddit-like feed, what document shape do you actually use?",
  ],
  [
    "mongodb",
    "Aggregation pipeline vs app-side joins: where do you draw the line?",
    "Lookup stages can be hard to optimize, but app-side joins are N+1 traps. For a dashboard with several related collections, how do you decide?",
  ],
  [
    "mongodb",
    "How do you enforce data consistency without transactions everywhere?",
    "Multi-document transactions exist but carry performance costs. For denormalized counters and activity feeds, what consistency level do you actually design for?",
  ],
  [
    "mongodb",
    "What's your migration strategy for changing a document shape at scale?",
    "Lazy migration on read vs a full backfill job vs dual-write. For a collection with millions of documents, which approach do you prefer?",
  ],
  [
    "mongodb",
    "Text search in MongoDB vs dedicated search — when is it enough?",
    "The text index handles basic keyword search, but relevance tuning and faceting are limited. At what point do you move to Elasticsearch or Typesense?",
  ],
  [
    "mongodb",
    "How do you monitor slow queries beyond the profiler?",
    "The profiler captures everything but gets noisy. What's your practical setup for catching slow queries and missing indexes in production?",
  ],
  // docker
  [
    "docker",
    "Multi-stage builds: where do you put the line between image size and build speed?",
    "Alpine-based scratch images save megabytes but lose debugging tools and need musl-compatible binaries. For a production service, what's your base image policy?",
  ],
  [
    "docker",
    "How do you handle secrets in docker build args safely?",
    "Build args end up in the image history, so they're not real secrets. Do you use BuildKit secrets, external config, or something else for values needed at build time?",
  ],
  [
    "docker",
    "What's your healthcheck pattern for a Node service in compose?",
    "Healthchecks matter for compose dependencies, but Node apps don't always expose a ready endpoint. Do you add a dedicated /healthz route or use process checks?",
  ],
  [
    "docker",
    "Docker vs Podman in 2026 — has anyone actually switched?",
    "Podman's daemonless model is nice for security, but Docker compatibility and tooling are everywhere. For local dev, is the switch worth any friction?",
  ],
  [
    "docker",
    "How do you debug a container that starts and immediately exits?",
    "docker logs is empty, exit code 1, and the app has no logger yet. What's your systematic approach to diagnosing startup failures?",
  ],
  [
    "docker",
    "What's the right way to ship a Python image without pip install hell?",
    "Pip resolving dependencies at build time creates non-reproducible images unless you pin hashes. With uv making resolution faster, what's the modern standard for Python Dockerfiles?",
  ],
  // kubernetes
  [
    "kubernetes",
    "Requests vs limits: what's your production policy to avoid CPU throttling?",
    "Limits protect neighbors but throttle your own pods. Setting CPU limits equal to requests avoids throttling but wastes capacity. What policy do you run in production?",
  ],
  [
    "kubernetes",
    "How do you do zero-downtime deploys when the rolling update keeps failing?",
    "Readiness probes failing during startup cause rolling updates to stall and old pods to be killed. What's your debugging sequence when a rollout gets stuck?",
  ],
  [
    "kubernetes",
    "Network policies: are you enforcing them in production?",
    "Default-deny namespaces are safer but break things subtly. Have you actually rolled out NetworkPolicies, and what broke at first?",
  ],
  [
    "kubernetes",
    "What's your approach to secrets — sealed-secrets, vault, or external-secrets?",
    "Sealed-secrets are git-friendly, Vault is powerful but heavy, external-secrets bridges cloud KMS. For a small cluster team, which do you run?",
  ],
  [
    "kubernetes",
    "How do you debug a pod stuck in CrashLoopBackOff with no logs?",
    "The container exits before the logger flushes. I've added init delays and sidecar log shippers. What's your reliable way to capture early-boot errors?",
  ],
  [
    "kubernetes",
    "When is it worth moving off managed K8s to bare-metal?",
    "Managed control planes cost money but remove upgrade pain. For teams that hit control-plane limits or want GPU flexibility, when does the math flip?",
  ],
  // devops
  [
    "devops",
    "Your CI pipeline runs 40 minutes — what are the first three things you cut?",
    "Mine is dominated by dependency installs, a flaky e2e suite, and full-image builds on every commit. What gave you the biggest win when optimizing yours?",
  ],
  [
    "devops",
    "Observability vs monitoring: where does your team actually start?",
    "Everyone says 'start with the golden signals', but the practical first step is usually logs. What's a realistic observability roadmap for a two-person infra team?",
  ],
  [
    "devops",
    "How do you do canary releases without a dedicated platform?",
    "Without Argo Rollouts or a service mesh, canaries mean manual traffic splitting or separate deploys. What's the lightest-weight approach that's still safe?",
  ],
  [
    "devops",
    "What's the best way to teach a small team basic on-call hygiene?",
    "Runbooks, severity definitions, and alert fatigue are easy to write about but hard to enforce. What actually changed your team's on-call experience?",
  ],
  [
    "devops",
    "Infrastructure as code: Terraform vs Pulumi vs CDK in 2026?",
    "Terraform is the default but has state and language pain. Pulumi and CDK bring real programming languages. What's the honest tradeoff for a new project?",
  ],
  [
    "devops",
    "How do you handle secrets drift between environments?",
    "Secrets always end up different between staging and prod, and the diff is invisible in Git. What process keeps environments honest?",
  ],
  // machinelearning
  [
    "machinelearning",
    "Fine-tuning vs RAG for domain-specific Q&A in 2026?",
    "RAG is cheaper to update but struggles with reasoning over complex documents; fine-tuning captures tone but goes stale. For a support bot over a large knowledge base, what's your split?",
  ],
  [
    "machinelearning",
    "How do you evaluate LLM output quality without a golden set?",
    "LLM-as-judge is popular but biased; human eval doesn't scale. For a team that needs quick iteration, what evaluation setup is worth building first?",
  ],
  [
    "machinelearning",
    "What's your data-labeling workflow for a two-person team?",
    "No budget for a labeling vendor, and the founders are the domain experts. How do you structure labeling so it's actually usable for training?",
  ],
  [
    "machinelearning",
    "MLOps: what's actually worth automating first?",
    "Experiment tracking, model registry, or deployment pipelines — for a small team, which automation gives the most value before you have a real workflow?",
  ],
  [
    "machinelearning",
    "How do you keep embeddings fresh for a constantly changing corpus?",
    "Documents change daily, so stored embeddings go stale, but re-embedding everything is expensive. What's your refresh strategy?",
  ],
  [
    "machinelearning",
    "Local LLMs vs API models for a cost-sensitive product — real numbers?",
    "API costs scale with usage, but local inference needs GPUs and care. For a product with spiky traffic, when do the economics actually favor running your own?",
  ],
];

async function main() {
  const ahmad = await db.query.users.findFirst({
    where: (table, { eq: e }) => e(table.username, "ahmad"),
    columns: { id: true },
  });

  if (!ahmad) {
    throw new Error("User 'ahmad' not found. Sign up or create the user first.");
  }

  const slugs = [...new Set(POSTS.map(([slug]) => slug))];
  const communityRows = await db.query.communities.findMany({
    where: (table, { inArray: inA }) => inA(table.slug, slugs),
    columns: { id: true, slug: true, postCount: true, memberCount: true },
  });
  const communityById = new Map(communityRows.map((c) => [c.slug, c]));

  const missing = slugs.filter((slug) => !communityById.has(slug));
  if (missing.length > 0) {
    throw new Error(`Communities not found: ${missing.join(", ")}`);
  }

  const random = seededRandom(42);
  const now = Date.now();
  const spreadMs = 14 * 24 * 60 * 60 * 1000;

  const values = POSTS.map(([slug, title, body], index) => {
    const community = communityById.get(slug)!;
    return {
      communityId: community.id,
      authorId: ahmad.id,
      title,
      slug: slugify(title),
      body,
      score: Math.floor(random() * 31),
      commentCount: 0,
      createdAt: new Date(
        now - spreadMs + (index / POSTS.length) * spreadMs + random() * 60 * 60 * 1000,
      ),
    };
  });

  await db.insert(schema.posts).values(values).onConflictDoNothing();

  // Ensure @ahmad is a member of every community he posted in.
  const memberships = communityRows.map((community) => ({
    communityId: community.id,
    userId: ahmad.id,
    role: "member" as const,
  }));
  await db
    .insert(schema.communityMembers)
    .values(memberships)
    .onConflictDoNothing();

  // Recompute counts from actual rows so re-runs stay idempotent.
  for (const community of communityRows) {
    const postCount = await db
      .select({ n: drizzleSql<number>`count(*)::int` })
      .from(schema.posts)
      .where(eq(schema.posts.communityId, community.id));
    const memberCount = await db
      .select({ n: drizzleSql<number>`count(*)::int` })
      .from(schema.communityMembers)
      .where(eq(schema.communityMembers.communityId, community.id));

    await db
      .update(schema.communities)
      .set({
        postCount: postCount[0]?.n ?? 0,
        memberCount: memberCount[0]?.n ?? 0,
      })
      .where(eq(schema.communities.id, community.id));
  }

  const totalPosts = await db
    .select({ n: drizzleSql<number>`count(*)::int` })
    .from(schema.posts)
    .where(eq(schema.posts.authorId, ahmad.id));

  console.log(`@ahmad now has ${totalPosts[0]?.n ?? 0} posts across ${communityRows.length} communities (members added where missing).`);
}

main()
  .catch((err) => {
    console.error("Seeding posts failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));