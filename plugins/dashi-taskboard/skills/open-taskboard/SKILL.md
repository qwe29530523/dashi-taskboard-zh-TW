---
name: open-taskboard
description: Open or start the Traditional Chinese Dashi Taskboard UI inside Codex without asking the user to run commands from the repository folder.
---

# Open Taskboard

Use this skill when the user asks to open, start, show, install into Codex, or bring up the Dashi Taskboard / Codex Taskboard UI.

Run the plugin helper script resolved relative to this skill:

```bash
../../scripts/open-taskboard.sh
```

The helper finds the Dashi Taskboard repository. If the plugin is running from Codex's plugin cache and no checkout is available, it clones `qwe29530523/dashi-taskboard-zh-TW` into the user's cache. It then installs dependencies with `npm ci` on first use if needed, starts the Codex Taskboard launcher, and asks Codex to open the UI. Do not ask the user to `cd` into the repository or type the launcher command themselves.

If the command prints JSON containing `taskboardUrl` and the `mcp__codex_app.open_in_codex` tool is available, open that URL in a Codex browser panel. Then report the concise result to the user.
