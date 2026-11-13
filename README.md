# Monorepo Starter

Monorepo Starter is a template for a TypeScript monorepo built on npm workspaces and Turborepo. It holds one empty library package, a place for apps, and the repo-wide tooling around them: formatting, linting, type checking, empty unit suites, builds with type declarations, git hooks and a hand-started npm publish workflow. A monorepo made from it passes all of its checks before it has any code of its own.

## Using the template

Create a repository from this template, then rename the root and the library package, and add packages under `packages/` and apps under `apps/`. The library starts private, and its publish workflow notes the switch to flip when the package is ready to go public.

## License

[MIT](LICENSE)
