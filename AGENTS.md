# Project Guidance

## UI Priority

1. Reuse an installed component from `src/components/ui`.
2. If no installed component fits, search the official shadcn registry.
3. Install the official shadcn component before considering custom code.
4. Build a custom component only when no suitable shadcn component exists.
5. Compose custom components from shadcn primitives and semantic tokens; do not create parallel visual primitives or hardcode colors.

The full visual contract is documented in `design-system/devshub/MASTER.md` and demonstrated at `/design-system`.
