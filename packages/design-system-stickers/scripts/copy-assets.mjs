import { cp, mkdir } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
await mkdir(dist, { recursive: true });
await cp(new URL("../assets/", import.meta.url), new URL("../dist/assets/", import.meta.url), {
  force: true,
  recursive: true,
});
await cp(
  new URL("../src/generated/catalogs/", import.meta.url),
  new URL("../dist/generated/catalogs/", import.meta.url),
  {
    force: true,
    recursive: true,
  },
);
await cp(
  new URL("../src/generated/manifests/", import.meta.url),
  new URL("../dist/generated/manifests/", import.meta.url),
  {
    force: true,
    recursive: true,
  },
);
