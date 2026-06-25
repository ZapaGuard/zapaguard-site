# zapaguard-site

The public-facing website for [ZapaGuard](https://zapaguard.com) — a free, open-source, zero-trust security proxy for the npm registry.

## Purpose

This repo contains the static site built with [Astro](https://astro.build), served via Cloudflare Pages. It includes the landing page and a static blog. No databases, no CMS, no tracking — just fast, auditable, public content.

## Usage

```bash
npm install
npm run dev      # local dev server at localhost:4321
npm run build    # static build output in dist/
npm run preview  # preview the build locally
```

Deployment is handled automatically via GitHub Actions (workflows coming). Every push to `main` via a merged PR triggers a Cloudflare Pages deploy.

## Contributing

Pull requests are welcome. For questions, suggestions, or discussion open an issue or head to [github.com/ZapaGuard](https://github.com/ZapaGuard).

## Credits

Built by **Stefan Silasi** (Cloud Engineer) and **Claude** (Anthropic AI) as part of the ZapaGuard open-source project.

## License

[MIT](https://opensource.org/license/mit)
