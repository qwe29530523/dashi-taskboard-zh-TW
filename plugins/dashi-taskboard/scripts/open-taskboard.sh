#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ -n "${DASHI_TASKBOARD_NODE:-}" ] && [ -x "${DASHI_TASKBOARD_NODE}" ]; then
  node_bin="${DASHI_TASKBOARD_NODE}"
elif command -v node >/dev/null 2>&1; then
  node_bin="$(command -v node)"
elif [ -x "${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]; then
  node_bin="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
elif [ -x "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node" ]; then
  node_bin="/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node"
else
  echo "Dashi Taskboard needs Node.js. Install Node.js or open this from Codex with workspace dependencies available." >&2
  exit 1
fi

exec "${node_bin}" "${script_dir}/open-taskboard.mjs" "$@"
