# Contributing

## Workflow

```bash
cd /root/admindocs          # or your clone
git pull
python3 -m venv .venv && . .venv/bin/activate && pip install -r docs/requirements.txt
mkdocs serve                # preview at http://127.0.0.1:8000
# edit docs/...; add new pages to `nav:` in mkdocs.yml
mkdocs build --strict       # must pass
git add -A && git commit -m "docs: …" && git push
```

## Style

- One topic per page. Put commands in fenced `bash` blocks.
- Mark observed facts with the date they were observed.
- Unfinished sections get:

  ```markdown
  !!! todo "Stub"
      - [ ] what belongs here
  ```

  List all stubs with `grep -rl 'todo "Stub' docs/`.
- Use admonitions: `note`, `tip`, `warning`, `danger`.
- **No secrets.** Write "in `/opt/cloack/.env` (`KEY_NAME`)", never the value.
- Link to existing in-house docs instead of copying them (see [Related docs](cluster/reference/related-docs.md)).

## Where pages go

| Folder | Put a page here when… |
|---|---|
| `docs/cluster/` | Both teams need it: facts about hardware, partitions, accounts, billing, storage layout, reference tables |
| `docs/sse/` | It's how SSE does something: software installs, user and lab support, portal and account work |
| `docs/systems/` | It's how Systems does something: hosts, networks, provisioning, Slurm admin, monitoring, operations |

If a page has facts for everyone and steps for one team, split it: the facts go in `cluster/`, the steps in the
team's folder, and each links to the other. Add every new page to `nav:` in `mkdocs.yml`. When you move a page,
add its old path to `redirect_maps` in `mkdocs.yml` so bookmarks keep working.

Docs copied from another repo (e.g. the CLOACK admin CLI guide) start with a box naming the source and saying
which copy wins.

## Publishing

https://admindocs.arch.jhu.edu is built on archgraf: `admindocs-build.timer` pulls `main` every 5 minutes, runs
`pip install -r docs/requirements.txt` and `mkdocs build`, and nginx serves the result behind Nginx Proxy Manager
(TLS, JHU network only, staff login from an NPM access list). A push to `main` is live within about 5 minutes; a
failed build keeps serving the last good one. `.readthedocs.yaml` is left over from the initial setup.

!!! todo "Stub"
    - [x] Remote repo: `jhu-arch/arch-admindocs` (private); archgraf pulls it every 5 min with a read-only deploy key
    - [x] Private hosting: archgraf + NPM staff login
    - [ ] Docs review cadence and owners (one per tab?)
