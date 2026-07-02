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

Deployment is handled automatically via GitHub Actions. Every push to `main` triggers a Cloudflare Pages deploy.

Required GitHub repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The Cloudflare API token should have Cloudflare Pages edit access for the account. The Pages project name used by the workflow is `zapaguard-site`, and the build output is `dist/`.

The deploy workflow uses the `production` GitHub Environment. Configure that environment with the Cloudflare secrets and require `@ZapaGuard` as the reviewer before deployment.

## Contributing

Pull requests are welcome. For questions, suggestions, or discussion open an issue or head to [github.com/ZapaGuard](https://github.com/ZapaGuard).

## Credits

Built by **Stefan Silasi** (Cloud Engineer), **ChatGPT** (OpenAI AI), **Claude** (Anthropic AI), and **Gemini** (Google AI) as part of the ZapaGuard open-source project.

## License

[MIT](https://opensource.org/license/mit)
