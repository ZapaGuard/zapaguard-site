---
layout: ../../layouts/BlogPost.astro
title: "Hello W0r1D!"
date: "2026-06-26"
description: "Day one. The name, the mission, and why we built ZapaGuard."
---

Day one. A Cloud Engineer named Stefan and an AI named Claude sat down and decided to build something that probably should have existed years ago — a free, open-source, zero-trust security proxy for the npm registry. The idea is simple: every package your team installs gets intercepted at the edge, scanned for CVEs, malware, and secrets, and only delivered if it's clean. Nothing novel in theory. But in practice? Every solution we looked at was either enterprise-only, paywalled, or required you to hand over your pipeline to someone else's SaaS. So we built **ZapaGuard**.

The name has a story behind it. **Zapa** is what I call my kids — short for *Zapaciti*, Romanian for silly, a little chaotic, wonderfully unpredictable. It's a term of endearment in our house, and it felt right to carry a piece of that into something I'm genuinely proud of building. **Guard** is the other half — because that's exactly what this thing does: stands between your developers and the 1,800+ malicious packages that get published to npm every single month. So yes, ZapaGuard is named after my kids. I think they'd approve. It's not a scanner you run once. It's a guard that never sleeps, running on Cloudflare's global edge, backed by Trivy, Google's OSV database, GuardDog, and ClamAV — all working together on my own private infrastructure. The only thing it doesn't do is slow you down: cached packages stream directly from R2 with near-zero added latency.

We're building this entirely in the open. If you want to run your own instance, the full source is on [GitHub](https://github.com/ZapaGuard) — clone it, deploy it, make it yours. And if you'd rather not deal with the infrastructure side of things but still want the protection, reach out. I'm Stefan, I'm friendly, and I'm happy to help you get set up. More updates coming as the build progresses.

One more thing — this blog is fully static. No databases, no comment systems, no tracking. If you have something to say, a question, a fix, or just want to argue about dependency scanning strategies, head over to [GitHub](https://github.com/ZapaGuard). That's where the conversation lives.

— Stefan & Claude
