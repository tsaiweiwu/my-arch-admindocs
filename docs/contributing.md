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
- Link to existing in-house docs instead of copying them (see [Related docs](reference/related-docs.md)).

## Read the Docs

`.readthedocs.yaml` builds with MkDocs on Python 3.12 from `docs/requirements.txt`.
To publish, push this repo to GitHub/GitLab and import it on readthedocs.org
(or a Read the Docs for Business org if the docs must be private).

!!! todo "Stub"
    - [x] Remote repo: `jhu-arch/arch-admindocs` (private); archgraf pulls it every 5 min with a read-only deploy key
    - [ ] Public vs. private hosting. Much of this content (IP plan, findings) **shouldn't be public**
    - [ ] Docs review cadence and owners
