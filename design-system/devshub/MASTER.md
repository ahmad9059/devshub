# DevsHub Design System

DevsHub uses the unmodified shadcn/ui `base-nova` component language with semantic OKLCH tokens. Components are source-owned under `src/components/ui` and should be composed rather than restyled into parallel primitives.

## Principles

- **Component priority:** use an existing official shadcn component first. If it is not installed, search the shadcn registry and add it before writing a custom component.
- Build a custom component only when the shadcn registry has no suitable primitive. Custom components must compose existing shadcn primitives where possible and use the same semantic tokens.
- Dark is the default theme; light and system themes remain fully supported.
- Use semantic utilities such as `bg-background`, `text-foreground`, and `border-border`.
- Do not use hardcoded colors in product components.
- Prefer shadcn components before introducing a new primitive.
- Keep focus states, labels, keyboard behavior, and reduced-motion behavior intact.
- Use Geist for interface text and Geist Mono for code, identifiers, and tabular data.
- Follow a 4px spacing rhythm and the shared `--radius` token.

## Tokens

The source of truth is `src/styles/globals.css`.

| Role                 | Utility                                  |
| -------------------- | ---------------------------------------- |
| Page surface         | `bg-background text-foreground`          |
| Raised surface       | `bg-card text-card-foreground`           |
| Primary action       | `bg-primary text-primary-foreground`     |
| Secondary action     | `bg-secondary text-secondary-foreground` |
| Quiet surface        | `bg-muted text-muted-foreground`         |
| Hover or selection   | `bg-accent text-accent-foreground`       |
| Error or destructive | `bg-destructive text-white`              |
| Structure            | `border-border`                          |
| Focus                | `ring-ring`                              |

Never reference raw OKLCH values outside the global theme mapping.

## Components

Installed primitives include alerts, avatars, badges, buttons, cards, checkboxes, dropdown menus, inputs, labels, selects, separators, skeletons, switches, tables, tabs, textareas, and tooltips.

Use `pnpm dlx shadcn@latest add <component>` to extend the system. Review generated source and do not overwrite existing components without checking the diff.

Before adding UI, follow this order:

1. Reuse an installed component from `src/components/ui`.
2. Search the official shadcn registry for a suitable component.
3. Install the registry component with the shadcn CLI.
4. Only then build a project component by composing shadcn primitives.

## Theme

`src/components/theme-provider.tsx` controls class-based theming through `next-themes`. `src/components/theme-toggle.tsx` is the canonical theme control. Mount the provider once in the root layout and use semantic tokens everywhere below it.

## Reference

The live component and foundation reference is available at `/design-system`.
