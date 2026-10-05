# Releases and deployment

The public repository is hosted at `https://github.com/cofob/design-system`.

## GitHub Packages

The public packages are scoped to `@cofob`, linked to `https://github.com/cofob/design-system`, and published to `https://npm.pkg.github.com`. GitHub Packages requires authenticated npm installs even for public packages.

Add a Changeset for every public change:

```sh
npm run changeset
```

The CSS, React, Svelte, and Asciinema Player packages are a fixed group. The build-time assets and sticker assets packages are versioned independently. On `main`, `changesets/action` maintains a version pull request. Merging that pull request builds and publishes all packages with the workflow `GITHUB_TOKEN`; no long-lived npm token is stored.

## npm

The same six packages also publish to `https://registry.npmjs.org/` as `@cofob2/design-system-*`. The npm copies use the same versions and exports. Internal dependencies, compiled imports, types, Svelte files, and README examples use the npm scope. Source workspaces keep the GitHub scope.

The release workflow publishes to npm after GitHub Packages when no changesets remain. It uses npm 11.8.0 and GitHub Actions OIDC with `id-token: write`. Versions that already exist are skipped, so a failed run can be retried. Registry or authentication errors stop the run.

For first-time setup:

1. Create the `cofob2` npm organization, or use the npm account named `cofob2`.
2. Run `npm ci`, `npm run build`, and `npm run publish:npm -- --dry-run`. The last command prints the six prepared archive paths and keeps them in a temporary directory.
3. If the packages do not exist on npm, run `npm login --registry=https://registry.npmjs.org/`. Publish each prepared archive with `npm publish /absolute/path/to/archive.tgz --ignore-scripts --access public --registry=https://registry.npmjs.org/`, in the printed order.
4. Open each package's npm settings and add a GitHub Actions trusted publisher: owner `cofob`, repository `design-system`, workflow filename `release.yml`, no environment. Enable direct `npm publish`.
5. Run the release workflow after the change reaches `main`. Check that all six npm packages have the expected versions and that consumer installs need no GitHub credentials.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for the package settings. Dry runs do not check OIDC authentication. Do not store an npm publication token in the repository or workflow.

To test publication against a local registry, use `npm run publish:npm -- --registry=http://127.0.0.1:4873/`. This changes the registry in the prepared copies only. Run it twice to check that existing versions are skipped.

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
