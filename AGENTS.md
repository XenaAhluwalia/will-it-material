# Working on Will it Material?

Several AI coding sessions (Claude Code, Codex) work on this repo at the same time. These rules keep their work from colliding and make sure every change is previewed before it reaches the live site.

## Where things live

- **GitHub:** `XenaAhluwalia/will-it-material` (private).
- **Vercel:** `main` deploys to production at https://will-it-material.vercel.app. Every other branch gets its own preview URL automatically when pushed.
- **Main checkout:** `~/Desktop/Will it Material?`. The Desktop is synced to **iCloud**, which can offload files inside `.git` (git then hangs) and creates `* 2.*` duplicate files. Don't keep extra clones or worktrees there.

## Rules

1. **Never commit directly to `main`.** One branch per task, named `claude/<topic>` or `codex/<topic>`.
2. **Don't switch branches in the shared Desktop checkout.** Other sessions are editing files there. Do your work in your own worktree outside iCloud:
   ```bash
   git -C ~/Desktop/"Will it Material?" fetch origin
   git -C ~/Desktop/"Will it Material?" worktree add -b claude/<topic> ~/dev/wim-<topic> origin/main
   cd ~/dev/wim-<topic> && npm ci
   ```
   Remove it when the branch is merged: `git worktree remove ~/dev/wim-<topic>`.
3. **Commit as the GitHub account**, or Vercel blocks the preview ("GitHub couldn't verify an account"):
   ```bash
   git config user.email   # must be 274556189+XenaAhluwalia@users.noreply.github.com
   ```
4. **Check before pushing:** `npm run typecheck && npm run lint`. Run `npm run build` only inside your own worktree, never in the Desktop checkout while the dev server is running (it overwrites `.next` and breaks the server).
5. **Push the branch and get its Vercel preview link:**
   ```bash
   git push -u origin <branch>
   gh api "repos/XenaAhluwalia/will-it-material/deployments?ref=<branch>" --jq '.[0].id' \
     | xargs -I{} gh api repos/XenaAhluwalia/will-it-material/deployments/{}/statuses --jq '.[0] | .state + " " + .environment_url'
   ```
   Report the preview URL to the user. If the state is `failure`, read the Vercel status on the commit (`gh api repos/XenaAhluwalia/will-it-material/commits/<sha>/status`) and fix it.
6. **Merge to `main` only after the preview works and the user says so.** Rebase on the latest `origin/main` first; merge with a pull request or a fast-forward. Pushing `main` deploys to production.
7. **One local dev server only:** `npm run dev` from the Desktop checkout on the default port, http://localhost:3000. Don't start more; to look at a branch, use its Vercel preview.
8. **Never commit secrets.** API keys live in `.env.local` (gitignored) and in Vercel's Environment Variables (`ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`).

Tools on this Mac: Node is at `~/.local/node/bin` and `gh` at `~/.local/bin/gh`; neither is on the default PATH.
