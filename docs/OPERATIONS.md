# Releases and deployment

Repository metadata points at `https://github.com/cofob/design-system`. Creating that public remote and
connecting the local checkout are intentional one-time external steps; no workflow attempts to create the
repository.

## GitHub Packages

The public packages are scoped to `@cofob`, linked to `https://github.com/cofob/design-system`, and published to `https://npm.pkg.github.com`. GitHub Packages requires authenticated npm installs even for public packages.

Add a Changeset for every public change:

```sh
npm run changeset
```

The three packages are a fixed group. On `main`, `changesets/action` maintains a version pull request. Merging that pull request builds and publishes all packages with the workflow `GITHUB_TOKEN`; no long-lived npm token is stored.

## Showroom

The Astro site is a static build in `apps/showroom/dist`. Create the direct-upload Pages project once while authenticated:

```sh
npx wrangler pages project create cofob-design-system --production-branch main
```

Production deploys use:

```sh
npm run deploy:showroom
```

GitHub Actions requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The workflow deploys `main` as production and same-repository pull requests as branch previews.

After the first successful deployment, associate `design.cofob.dev` with the `cofob-design-system` Pages project in Cloudflare Pages. Domain association is a one-time control-plane step; ongoing asset deployment remains a Wrangler command.
