# Skipjack Admin Docs

Administrator documentation for the **Skipjack** HPC cluster (ARCH, Johns Hopkins
University), written in Markdown and built with [MkDocs](https://www.mkdocs.org/)
+ [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/), served at
https://admindocs.arch.jhu.edu (archgraf rebuilds from `main` every 5 minutes).

## Build locally

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r docs/requirements.txt
mkdocs serve            # live preview at http://127.0.0.1:8000
mkdocs build --strict   # must pass before you push
```

## Layout

```
.readthedocs.yaml     RTD build config
mkdocs.yml            site config + navigation
docs/cluster/         facts both teams use (hardware, partitions, billing, storage, reference)
docs/sse/             Scientific Support Engineers: software, user/lab support, portal
docs/systems/         Systems team: infrastructure, Slurm admin, monitoring, operations
docs/requirements.txt pinned doc toolchain
```

## Conventions

- Pages that describe what is *on the system* say when it was observed
  (first captured from `mgmt02` on **2026-10-12**). Re-verify before acting on it.
- Pages or sections that still need writing carry a `!!! todo "Stub"` block
  listing what belongs there. `grep -rl 'todo "Stub' docs/` lists them all.
- **Never commit secrets** (passwords, tokens, munge/JWT keys, webhook URLs,
  `.env` contents). Reference *where* a secret lives, never its value.

See `docs/contributing.md` for more.
