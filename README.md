# blog

Hugo blog at https://vratislav.svejdovi.org, deployed by Cloudflare Workers Builds on every push to `main`.

## New post

Create `content/posts/my-post.md`:

```markdown
---
title: "My post"
date: 2026-11-24
---

Text in Markdown.
```

Commit and push — that's it. (Add `draft: true` to keep it unpublished.)
With Hugo installed locally: `hugo new posts/my-post.md`, preview with `hugo server -D`.

## Cloudflare settings

- Build command: `hugo --gc --minify`
- Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`, uploads `public/`)
