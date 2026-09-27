# Oh Really Oliver

A Next.js app using the App Router, TypeScript, SCSS, and ESLint.

## Development

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Edit `src/app/page.tsx` and `src/app/globals.scss` to get started. Component styles can use `*.module.scss` files.

## Checks and production

```sh
pnpm lint
pnpm build
pnpm start
```

## Formatting

```sh
pnpm format       # Format all supported project files
pnpm format:check # Check formatting without changing files
```

Customize Prettier rules in `.prettierrc.json`. Generated files and dependencies
are excluded.

`pnpm install` installs the Husky Git hooks through the `prepare` script.
Before each commit, lint-staged formats supported staged files with Prettier and
includes those formatting changes in the commit. Formatting errors block the commit.
