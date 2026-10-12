# Skipjack Admin Docs

Administrator documentation for the **Skipjack** HPC cluster (ARCH, Johns Hopkins
University), written in Markdown and built with [MkDocs](https://www.mkdocs.org/)
+ [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) for
[Read the Docs](https://readthedocs.org/).

## Build locally

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r docs/requirements.txt
mkdocs serve            # live preview at http://127.0.0.1:8000
mkdocs build --strict   # what CI / RTD should pass
```

## Layout

```
.readthedocs.yaml     RTD build config
mkdocs.yml            site config + navigation
docs/                 all content (one folder per nav section)
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
