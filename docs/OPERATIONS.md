# Releases and deployment

The public repository is hosted at `https://github.com/cofob/design-system`.

## GitHub Packages

The public packages are scoped to `@cofob`, linked to `https://github.com/cofob/design-system`, and published to `https://npm.pkg.github.com`. GitHub Packages requires authenticated npm installs even for public packages.

Add a Changeset for every public change:

```sh
npm run changeset
```

The CSS, React, and Svelte packages are a fixed group. The build-time assets and sticker assets packages are versioned independently. On `main`, `changesets/action` maintains a version pull request. Merging that pull request builds and publishes all packages with the workflow `GITHUB_TOKEN`; no long-lived npm token is stored.

## Showroom

The Astro site is a static build in `apps/showroom/dist`. Cloudflare Pages is connected directly to the
GitHub repository, so Cloudflare owns production and preview builds rather than GitHub Actions.

Use these Pages build settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `apps/showroom/dist`

For a one-time project setup or a manual recovery deployment, Wrangler remains available:

```sh
npx wrangler pages project create cofob-design-system --production-branch main
```

Manual production deploys use:

```sh
npm run deploy:showroom
```

`design.cofob.dev` is associated with the `cofob-design-system` Pages project. Domain association is a
one-time control-plane step; ongoing production and branch-preview deployments are triggered by the
Cloudflare Git integration.
