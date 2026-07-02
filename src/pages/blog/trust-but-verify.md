---
layout: ../../layouts/BlogPost.astro
title: "Trust, but V3r1fy"
date: "2026-07-02"
description: "Locking down our own house: branch rulesets, signed everything, auto-tagged releases, and a proper deploy pipeline."
---

Today we turned the security lens on ourselves. It would be a little embarrassing to build a zero-trust proxy for npm while our own repo accepted unsigned commits from anywhere, so we spent the day hardening the house we live in. A senior-secops-style review of the [zapaguard-site](https://github.com/ZapaGuard/zapaguard-site) repo turned into a checklist, and the checklist turned into a pile of merged PRs.

Here's what changed. The repo now runs on a single **branch ruleset**: no force pushes, no deletions, linear history, GPG-signed commits only, squash-only merges, and every change to `main` goes through a pull request gated by **CodeQL** code scanning. Secret scanning with push protection was already on — now it's backed by a CODEOWNERS file and required review-thread resolution, so nothing gets merged with an unanswered question hanging on it. We also published a [security policy](https://github.com/ZapaGuard/zapaguard-site/security/policy): if you find a vulnerability, there's now a private reporting path, a five-business-day acknowledgment commitment, and a safe-harbor clause. Responsible disclosure shouldn't require detective work.

The fun part: **releases are now automatic**. Every merge to `main` mints the next tag — `v1`, `v2`, `v3`... — bakes it into the build, and ships it to Cloudflare Pages through a pipeline that runs on Node 24 with every GitHub Action pinned to an exact commit SHA. No floating tags, no "latest" surprises — the same supply-chain discipline we preach for npm packages, applied to our own CI. Scroll down: that little version number in the footer next to the ZapaGuard name is the running tag, straight from the pipeline. If you're reading this, v-something built, scanned, tagged, and deployed itself while we drank coffee. The blog also got the same header and footer as the landing page, because consistency is cheap and jank is not.

None of this is glamorous work. Nobody stars a repo because its branch ruleset is tight. But if we're going to stand between your developers and a registry that ships thousands of malicious packages a year, the least we can do is make our own front door hard to kick in. Trust, but verify — starting with ourselves.

As always, everything is in the open on [GitHub](https://github.com/ZapaGuard) — the rulesets, the workflow, the whole conversation. Come argue with us about squash merges.

— Stefan & Claude
