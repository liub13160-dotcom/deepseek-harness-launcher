# dsh-launcher

<div align="center">

**Cross-platform multi-command launcher for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)**

One command to start · Auto-open the browser · Check status · Stop cleanly

[![GitHub stars](https://img.shields.io/github/stars/liub13160-dotcom/deepseek-harness-launcher?style=social)](https://github.com/liub13160-dotcom/deepseek-harness-launcher)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D16-blue.svg)](package.json)

</div>

---

## Why this?

DeepSeek Harness's web UI is started with `dsh web` — but that leaves you to open a browser, remember the port (`3080`), and hunt down how to stop it. This tool wraps it into a **real cross-platform CLI**:

- `start` → boots the harness and **auto-opens the browser** when it's ready
- `status` → tells you whether it's running
- `stop` → stops it cleanly (no more hunting for the PID)
- `list` → shows your profiles
- `doctor` → diagnoses your environment

Works on **Windows / macOS / Linux** — no shell scripts, no platform-specific hacks.

## Install / Run

Requires Node.js ≥ 16 (you already have it, since DeepSeek Harness is npm-based).

```bash
# run directly — no install needed
node dsh-launcher.mjs <command>

# or install once as a global command
npm link                    # or: npm install -g .
dsh-launcher <command>
```

## Usage

```bash
dsh-launcher start                # start the web profile + open browser
dsh-launcher start tui            # start another profile
dsh-launcher start --port 8080    # custom port
dsh-launcher status               # is it running?
dsh-launcher stop                 # stop it
dsh-launcher list                 # list profiles
dsh-launcher doctor               # environment diagnostics
dsh-launcher help
```

| command | default | options |
|---|---|---|
| `start [profile]` | `web` | `--port`, `--host`, `--no-open`, `--detach` |
| `status` | — | — |
| `stop` | — | — |
| `list` | — | — |
| `doctor` | — | — |

## Windows double-click

Windows users can double-click `启动DeepSeek-Harness.bat` — same as `node dsh-launcher.mjs start`.

> That `.bat` is **GBK-encoded** for the Chinese console, so it shows as mojibake on GitHub but works locally.

## How it works

`start` first probes the port. If it's already up → just opens the browser. Otherwise it runs
`dsh --profile <profile> --host <host> --port <port> --no-open`, then polls until the port answers and
opens your browser. `stop` finds the process either via a pidfile (`--detach`) or the port listener
(`netstat` / `lsof`). **Zero third-party dependencies** — only Node built-ins.

## Files

- `dsh-launcher.mjs` — the CLI (single file, zero deps)
- `启动DeepSeek-Harness.bat` — Windows wrapper
- `package.json` — npm packaging / bin

## License

[MIT](LICENSE)
