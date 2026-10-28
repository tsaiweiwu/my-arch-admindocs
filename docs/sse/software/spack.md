# SpackON: shared Spack software stacks

!!! note "Revision 2026-08 (stacks era)"
    **Revision note (2026-08):** this is the stacks-era revision of
    `SpackON_sharepoint.md`. It documents the git/lockfile-driven admin
    workflow introduced with the `jhu-arch/arch-spack-stacks` repository:
    in the **recommended flow** — `spackon --deploy --env <stack-name>` from
    the canonical checkout — the shared install tree is populated only from a
    PR-reviewed `spack.lock`, with no re-concretization at deploy time. The
    original file is kept for reference; **this version supersedes it.**

    That guarantee is a property of *that* command, not of spackon as a whole.
    Routes that bypass it still exist and are documented below:
    `--deploy <spec>` and the named-env fallback re-concretize in the
    deployer's environment; `-i -arch` builds straight into the shared tree;
    and `--deploy --env <dir>` deploys a committed, clean stack that may not
    be merged yet. All of them still require deploy-group membership, a
    trusted key, and (for `--deploy`) signed binaries from the cache — what
    they skip is the **review**, not the provenance.

## Getting Started

### Master — one time ever (before anyone else)

```bash
sudo -v
spackon --setup        # creates all shared dirs with correct ownership
                       # (incl. the empty stacks checkout dir)
git clone git@github.com:jhu-arch/arch-spack-stacks.git /apps/helpers/spack/stacks
spackon --setup        # again, after the clone: makes the checkout group-writable
                       # throughout + core.sharedRepository=group, so every admin's
                       # --deploy can fast-forward it
```

The owner of the clone can do the second part by hand, without sudo (the
`chmod` complains about `.`, which belongs to the master and is already
2775 — harmless):

```bash
cd /apps/helpers/spack/stacks
chmod -R g+rwX .
git -C /apps/helpers/spack/stacks config core.sharedRepository group
```

---

### Admin user — first time setup

#### 1. Create and export your GPG signing key (once per user)

```bash
spackon --keys create
spackon --keys export
```

#### 2. Ask master to trust your key

By site convention the master runs this after each new key is exported.
The command itself is **not** gated — any user may trust the shared
keyspot, and every admin needs a trusted key before `--deploy`:

```bash
spackon --keys trust
```

#### 3. GitHub access (once per user)

The repo is private and cloned over SSH, so a login node needs an SSH
key that your GitHub account knows. Once per user:

```bash
ls ~/.ssh/id_ed25519.pub 2>/dev/null || ssh-keygen -t ed25519 -C "$USER@skipjack"
cat ~/.ssh/id_ed25519.pub     # add at github.com → Settings → SSH and GPG keys
ssh -T git@github.com         # must greet you by GitHub username
```

On the new key, **Configure SSO → Authorize** it for the `jhu-arch` org
(SAML), and ask the master for org membership if you have none. Then let
spackon create your working clone (the shared store already exists, so
`--admin -c` only adds the clone; `git clone git@github.com:jhu-arch/arch-spack-stacks.git
/scratch/jhu/$USER/stacks` is the same thing by hand):

```bash
spackon --admin -c
```

#### 4. Admin mode — how every admin command below is run

`--admin` selects the shared build store and your stacks working clone. Use
it once to open the subshell (`spackon --admin`, prompt `( spackon:admin )`)
and every `spackon` command typed inside inherits it — or add `--admin` to
each command from a login shell. A plain `spackon` asks a deploy-group
member admin/personal. There is no `export SPACK_ROOT` any more; an
exported value that disagrees with `--admin` is refused.

`Permission denied (publickey)` means the key is missing on the cluster or
not on your GitHub account; a SAML SSO message means it is not authorized
for the org; `Repository not found` means you are not an org member.

---

### Admin user — build and deploy a package (stacks flow)

The worked example below is `gcc-12.5.0`, the sequence validated end to end
on 2026-08-10. For the same steps with the reasoning behind each one and the
known site issues, see `spackon_admin_tutorial.md`.

#### Stage 1: create the stack and build in shared scratch

In the admin subshell, `spack env create <name>` creates a **stack** in your
working clone (Spack itself rejects dots in environment names, so a stack is
a directory environment): branch `add-<name>` from `origin/main`, directory
copied from `_template`, compiler era chosen from a menu. `spackon --admin
--new <name>` is the same from outside. Every rewrite prints the real
command it ran.

```bash
spackon --admin
spack info gcc                           # look before deciding the spec
spack env create gcc-12.5.0              # era menu → 0 (none: first compiler)
spack env activate gcc-12.5.0 -p         # → spack env activate -d /scratch/jhu/<you>/stacks/intel/gcc-12.5.0 -p
spack add gcc@12.5.0+binutils+bootstrap %gcc@11.5.0
```

`intel/gcc-12.5.0/spack.yaml` now holds the spec (plus the `c`/`cxx`/`fortran`
require that the subshell's compiler lock writes for a `%compiler` spec):

```yaml
spack:
  include:
  - ../../common/packages-common.yaml    # site-wide: group-writable installs
  specs:
  - gcc@12.5.0+binutils+bootstrap %gcc@11.5.0
  view: false            # a view would write runtime state into the checkout
  concretizer:
    unify: true
    reuse: true
```

Concretize **against the shared scope** — the deploy job sees only that
scope, so concretizing with anything else produces hashes the deploy will
never look for. In the admin subshell `spack concretize` gets
`-C $SPACK_SCOPE` added for you:

```bash
spack concretize -f          # → [INFO] admin mode: spack -C /apps/helpers/spack/intel concretize -f
```

Then build through Slurm — `-i <name>` resolves the name in your working
clone and builds into the shared store. `cd` out of the clone first: Slurm
writes `slurm-<jobid>.out` to the submit directory, and that has no
business in a git checkout:

```bash
cd /scratch/jhu/$USER
spackon -i gcc-12.5.0 -p med -t 04:00:00 --account=<acct> --comment=accept_cost
# from a login shell: spackon --admin -i gcc-12.5.0 ...
```

`-i` accepts `-t <limit>` and passes any other option straight to `sbatch`
(`--account=`, `--comment=accept_cost`, `--mem=`); default is `-c 8 -t 240`.

> **Checkpoint** — `intel/gcc-12.5.0/spack.lock` exists, the job reaches
> `COMPLETED`, and the result is in the **shared store** with `/apps` still
> untouched:
> ```bash
> tail slurm-<jobid>.out     # ends with the module refresh, no errors
> spack -e gcc-12.5.0 find -pl   # in the admin subshell: -e <name> → the clone dir
> ```

#### Stage 2: push signed packages to cache

Hashes resolve against the shared store, where you just built (admin mode,
inherited in the subshell or given with `--admin`):

```bash
spackon --cache-push --env gcc-12.5.0
# ==> Stack 'gcc-12.5.0' resolved to /scratch/jhu/<you>/stacks/intel/gcc-12.5.0 (working clone)
# shows a preview of exactly what will be pushed → answer yes
```

> **Checkpoint** — signed blobs and an index appear in the mirror:
> ```bash
> ls /apps/software/spack/mirror-spack/build_cache/
> ```

#### Review: `--pr` commits BOTH files and pushes the branch; the PR is opened in the browser

```bash
module load gcc/12.5.0 && gcc --version     # smoke test: Stage 1 modules are in $HOME/modulefiles/lmod
spackon --pr gcc-12.5.0                     # or: spackon --admin --pr gcc-12.5.0
# Did you test the built software/module? (yes/no) yes
# [OK] Committed: intel: add gcc-12.5.0   (<sha>)
# [OK] Branch pushed: add-gcc-12.5.0
#      Open the pull request in your browser:
#        https://github.com/jhu-arch/arch-spack-stacks/compare/main...add-gcc-12.5.0?expand=1
```

`--pr` stages **only** `spack.yaml` + `spack.lock`, refuses a missing lock
or one older than the yaml, and lists anything else in the clone as
`[WARN] ... NOT part of this proposal` (a new `common/era-*.yaml` must be
committed on the branch by hand first). spackon never opens or merges the
PR. The reviewer reads the `spack.lock` diff: exactly which hashes enter
the tree. After the merge (≥1 approval required — enforced by the
`protect-main` ruleset) there is nothing to do by hand: `--deploy`
fast-forwards the canonical checkout itself.

> **Checkpoint** — your commit is on GitHub and nothing is left behind:
> ```bash
> git -C /scratch/jhu/$USER/stacks log --oneline -1 origin/add-gcc-12.5.0
> git -C /scratch/jhu/$USER/stacks status --short        # nothing under intel/gcc-12.5.0
> ```

#### Stage 3: lockfile-driven deploy from cache to shared install_tree

```bash
spackon --keys trust                        # once, before your first deploy
cd /scratch/jhu/$USER
spackon --admin --deploy --env gcc-12.5.0 \
        -p med -t 02:00:00 --account=<acct> --comment=accept_cost
```

Expected: `==> Updating the canonical checkout: git -C /apps/helpers/spack/stacks
pull --ff-only` with `<old> -> <new>`, then `==> Deploying stack 'gcc-12.5.0'
... (lockfile-driven: exactly the hashes committed in spack.lock)`. If you
get `[INFO] No stack 'gcc-12.5.0' ... (legacy)` instead, the PR is not
merged yet. A `[WARN]` on the pull (origin unreachable, `.git` not writable)
means the deploy went on with the checkout as it was — read the `->` line.

> **Checkpoint** — install prefixes (unlike module names) keep the building
> compiler, and the shared modules were regenerated:
> ```bash
> ls /apps/software/spack/intel/gcc/11.5.0/gcc/                  # 12.5.0-<hash>/
> find /apps/software/spack/intel/modulefiles/lmod -name '*.lua'
> git -C /apps/helpers/spack/stacks status --porcelain           # still clean
> ```

#### Verify as a regular user

The point of the pipeline is that an ordinary user can load the result:

```bash
module avail gcc                     # gcc/12.5.0 — on the default MODULEPATH since 2026-09-23
module load gcc/12.5.0
gcc --version
```

> No `module use` is needed: since 2026-09-23 the site shell init
> `/apps/Lmod` (sourced by every login) puts the vendor-matched `Core` on
> every user's **base** `MODULEPATH` — intel on Intel nodes, amd on AMD
> nodes, never both (stacking both Cores shows two indistinguishable
> `gcc/12.5.0` entries and still hides intel-only software on AMD nodes).
> Base path, not a module: `module purge` keeps it, `module reset` restores
> it. AMD nodes rely on the amd gcc module's intel fallback — see
> "Identifying Intel vs AMD via Modulefile" below (IMPROVEMENTS C3.3).

---

### Regular user (non-admin) — personal spack

*(unchanged — regular users never touch stacks)*

#### 1. Install personal spack (once)

```bash
spackon -c        # asks where: a scratch you can write to is suggested (your own, or your PI's)
```

#### 2. Activate spack subshell

```bash
spackon
```

#### 3. Create environment and build
```bash
spack env create locally
spack env activate locally
spack add python@3.11.9
spack concretize -f
spackon -i locally           # submits SLURM job
```

---

## Quick Start

### Activate spack subshell
```bash
spackon
```
### Full help
```bash
spackon help-all
```
### Admin help (`$SPACK_DEPLOY_GROUP` members)
```bash
spackon help-admin
```
### Master help (`$SPACK_ADMIN_USER` only)
```bash
spackon help-master
```

> Use the `spackon ` prefix — that is the form the dispatcher accepts, and it
> works from any shell. The bare names (`help-all`, `help-admin`,
> `help-master`) are shell functions that exist **only inside the spackon
> subshell**; outside it they are `command not found`.

---

## For Regular Users (non-admin)

You do not need to be a member of the `$SPACK_DEPLOY_GROUP` group to use
`spackon`. Regular ARCH users can:

1. **Use pre-installed software** — packages deployed by admin are available
   in the shared module tree without any spack setup.
2. **Install a personal spack** — build and manage your own packages.
3. **Build packages locally** — submit SLURM jobs into your personal spack.

### Use Pre-installed Packages

```bash
module avail           # list all available software
module load gcc/9.3.0 python/3.11.9
python --version
```

Module names are plain `{name}/{version}` — the Lmod hierarchy already
records which compiler built a package, so `python/3.11.9` only becomes
visible **after** the matching compiler module is loaded. See
[Config Scopes](#config-scopes).

### Install Your Own Spack

```bash
spackon -c             # install spack — asks where (once)
spackon                # activate your personal spack subshell
```

`-c` asks for the install directory because only PIs own
`/scratch/<aff>/<user>`. The suggestion is the first directory you can
write to: your own scratch if you have one, else your PI group's
(`/scratch/<aff>/<PI>/$USER/spack`), else `$HOME/spack` (with a quota
warning — builds are large). The answer is kept in `~/.spackon/config`;
modulefiles always go to `$HOME/modulefiles/lmod`. `spackon -r` forgets it.

### Build Packages in Your Personal Spack

```bash
spackon
spack env create myenv
spack env activate myenv
spack add python@3.11.9
spack concretize -f
spackon -i myenv       # submits SLURM job (8 cores, 4 h default)
```

Override the walltime with `-t` and pass anything else straight through to
`sbatch`:

```bash
spackon -i myenv -t 480 -p <partition> --mem=32G --account=<acct>
```

Packages install into `$SPACK_INSTALL_DIR` — your personal space only.

> **Note:** Personal builds do **not** go into the shared install tree
> (`$SPACK_INSTALL_TREE`). If you need a package added to the shared tree,
> ask a `$SPACK_DEPLOY_GROUP` member.

---

## Architecture Overview

### Who can write what

Write access to the shared tree is a **Unix group**, nothing else. There is
no spackon-internal permission system: every gate in the script checks your
group membership, and the filesystem enforces the same thing underneath.

| You are | You can | You cannot |
|---|---|---|
| any ARCH user | `module load` deployed software; run a personal spack in `/scratch/{aff}/{user}/spack`; `--keys list/trust` | write anything under `/apps/software/spack/` |
| member of `$SPACK_DEPLOY_GROUP` | all of the above, plus build in the shared store, `--cache-push`, `--deploy`, `-i -arch`, `--keys create/export` | run `--setup` |
| `$SPACK_ADMIN_USER` | all of the above, plus `--setup` (Stage 0, needs sudo) and `-i -push` / `-i -arch-push` | — |

At ARCH `$SPACK_DEPLOY_GROUP` is **`software`** (gid 10035) and
`$SPACK_ADMIN_USER` is the account that owns the shared tree. Both are read
from `${ARCH_SCOPE}/init` (`/apps/helpers/spack/init`) — that file is the
source of truth, so check it rather than trusting the names printed here.
Until 2026-08 the deploy gate was the much broader `admin` group (gid 10001).

Check your own membership with:

```bash
id -nG | tr ' ' '\n' | grep -x software     # prints 'software' if you are in it
```

The install trees, the shared scratch store, the buildcache and the keyspot
are all `2775` (setgid) and owned `$SPACK_ADMIN_USER:$SPACK_DEPLOY_GROUP`:

```bash
stat -c '%n %A %U:%G' /apps/software/spack/intel
# /apps/software/spack/intel drwxrwsr-x <master>:software
```

Setgid means files created there inherit the group, so **any** deploy-group
member can rebuild or uninstall what a colleague installed — that is
deliberate, and the reason build and deploy jobs also run with `umask 0002`.

### Runtime Variables

| Variable | Path | Who uses it | Purpose |
|---|---|---|---|
| `$SPACK_INSTALL_DIR` | `/scratch/{affiliation}/{user}/spack` (site default) | per user | Personal spack install; the directory chosen at `spackon -c` (`~/.spackon/config`) overrides the default |
| `$SPACK_SCRATCH` | `/scratch/{affiliation}/admin/spack` | all admins share | Shared admin build store (Stage 1) — selected by `--admin` |
| `$SPACKON_MODE` | `admin` / `personal` / empty | all | Which store this invocation works in: `--admin`, `--personal`, the prompt, or inherited from the subshell |
| `$SPACK_STACKS_CLONE` | `/scratch/{affiliation}/{user}/stacks` | admins | The admin's working clone of arch-spack-stacks (`--new`, `--pr`, bare names in `-i` / `--cache-push`) |
| `$SPACK_SCOPE` | `/apps/helpers/spack/{intel\amd}` | all | Config scope — auto-set by CPU vendor |
| `$SPACK_ARCH_NAME` | `intel` or `amd` | all | Arch name — auto-set by CPU vendor |
| `$SPACK_INSTALL_TREE` | `/apps/software/spack/{intel\amd}` | admins | Shared install tree — auto-set by CPU vendor |
| `$SPACK_STACKS` | `/apps/helpers/spack/stacks` | admins | Canonical checkout of arch-spack-stacks (deploy source, pull-only) |
| `$SPACK_PACKAGES` | `/apps/helpers/spack/packages` | admins | Shared checkout of the builtin recipes (spack-packages), pinned at `SPACK_PACKAGES_COMMIT` from `init`; every `-C $SPACK_SCOPE` command reads recipes here |
| `$SPACK_KEYSPOT` | `/apps/software/spack/build/keys` | admins | GPG public key directory |
| `$SPACK_GNUPGHOME` | `~/.spack_gpg` | admins | Per-user GPG home — deliberately **outside** `$SPACK_ROOT` |

> `affiliation` = `jhu` (default) or `schmidt` (users whose login starts with `ssci`)

> **All of these are exported by spackon itself**, so they only exist inside
> the spackon process and the subshell it starts. In a plain login shell they
> are empty — which is why the store is chosen with `--admin` / `--personal`,
> not by exporting paths (see Stage 1).

> **"Auto-set by CPU vendor" means the vendor of the machine running
> spackon** — not of the Slurm partition you pass with `-p`. The three
> arch-dependent variables are frozen into the `sbatch --wrap` before the
> job is queued, so from an Intel login node they always say `intel`, no
> matter which partition the job lands on. To act on the AMD scope or tree,
> run spackon on an AMD node (see Stage 3).

### Filesystem Paths

| Path                                          | Purpose/Type              | Notes/Permissions                       |
|-----------------------------------------------|---------------------------|-----------------------------------------|
| `/scratch/{aff}/admin/spack`                  | Shared admin build store  | all `$SPACK_DEPLOY_GROUP` write here    |
| `/scratch/{aff}/{user}/spack`                 | Personal spack install (default) | `spackon -c` asks; non-PIs use `/scratch/{aff}/{PI}/{user}/spack` or `$HOME/spack` |
| `~/.spackon/config`                           | The answer given at `spackon -c` | `SPACK_INSTALL_DIR=...`; outside `~/.spack`; removed by `spackon -r` |
| `/scratch/{aff}/{user}/stacks`                | Admin's working clone of arch-spack-stacks | `--admin -c` clones it; `--new`, `--pr` work here |
| `/apps/helpers/spack/stacks`                  | Canonical stacks checkout | fast-forwarded by `--deploy` (`git pull --ff-only`), 2775 |
| `/apps/helpers/spack/packages`                | Pinned recipes checkout   | read-only for admins; only `--setup` moves it |
| `/apps/software/spack/mirror-spack/build_cache` | arch buildcache         | signed: true                            |
| `/apps/software/spack/intel`                  | Shared install_tree (x86) | `$SPACK_DEPLOY_GROUP` write, 2775       |
| `/apps/software/spack/amd`                    | Shared install_tree (AMD) | `$SPACK_DEPLOY_GROUP` write, 2775       |
| `/apps/software/spack/{intel,amd}/modulefiles/lmod` | Shared Lmod modules  | generated at the end of each deploy     |
| `/apps/software/spack/build/keys`             | GPG public keys           | `$SPACK_DEPLOY_GROUP` write, 2775       |

**Config scopes** live in `/apps/helpers/spack/` — shared across all
`$SPACK_DEPLOY_GROUP` members. Each scope carries `config.yaml`
(install_tree projections, locks), `mirrors.yaml` (signed),
`modules.yaml` (shared Lmod root + module projections) and `repos.yaml`
(the pinned recipes checkout — see [Config Scopes](#config-scopes)).

---

## The Stacks Repository (arch-spack-stacks)

`github.com/jhu-arch/arch-spack-stacks` (private) is the **source of
truth** for everything deployed to the shared install tree.

- **One environment per deployed software**: each stack is a directory
  with `spack.yaml` + a **committed** `spack.lock`
  (`intel/gcc-12.5.0/`, `intel/zlib-1.3.1/`, ...). Locks are
  per-arch — `intel/` and `amd/` never share a lock.
- **All changes enter `main` via Pull Request** (≥1 approval, enforced).
  The lock diff shows exactly which hashes enter the tree.
- **Three copies, three roles:**

```
/scratch/jhu/<user>/stacks ──spackon --pr (commit+push)──► GitHub (PR → merge, in the browser)
                                                                  │
                                spackon --deploy: git pull --ff-only▼
                                                    /apps/helpers/spack/stacks
                                                                  │
                                                  spackon --deploy▼
                                                    /apps/software/spack/{intel,amd}
```

- The canonical checkout is **never edited in place** — `spackon --deploy`
  refuses stacks with missing or uncommitted `spack.lock`.
- **The compiler era is declared, not curated.** The deployed compiler is
  registered as an *external* in both shared scopes with
  `spackon --pin-compiler gcc@12.5.0`, so its bootstrap lineage (everything
  `%gcc@11.5.0` it was built with) never enters a downstream concretization at
  all. Each stack then states which era it belongs to by including
  `common/era-<compiler>-<version>.yaml` (`era-gcc-12.5.0.yaml`,
  `era-intel-oneapi-compilers-2026.1.0.yaml`), which pins the
  `c`/`cxx`/`fortran` providers. Both pieces are needed: `%gcc@12.5.0` on a root spec does **not**
  propagate to its dependencies, so without the era include `reuse: true`
  happily links older builds into a new package. The era lives in the stack —
  not in the scope — because a scope-level pin cannot be overridden by an
  environment, which would make it impossible to prepare the next compiler's
  stacks while the current one is in production. Rationale and measurements:
  spackon `IMPROVEMENTS.md` items C5 and C6.
- **Prefer the stack _name_ at Stage 3.** `--deploy --env` accepts either a
  bare name resolved under `$SPACK_STACKS/$SPACK_ARCH_NAME/` or a directory
  path, and applies the same lock + clean-checkout guard to both. A path
  outside the canonical checkout still deploys — it just cannot be checked
  for "merged into `main`", so spackon warns and points at the name form.
- See the repo's `README.md` for the full rules and the 7-step workflow.

---

## 3-Stage Collaborative Workflow

### Stage 0 — One-Time Setup
> #### ${SPACK_ADMIN_USER} runs once, requires sudo

```bash
sudo -v               # authenticate sudo first
spackon --setup       # creates + chowns + chmods all dirs
```

This creates with `chown ${SPACK_ADMIN_USER}:${SPACK_DEPLOY_GROUP}` and `chmod 2775`:
- `$SPACK_SCRATCH` — shared scratch store for all admin builds
- `$SPACK_INSTALL_TREE` / `$SPACK_INSTALL_TREE_AMD` — shared install trees
- `$SPACK_KEYSPOT` — GPG key directory
- `$SPACK_STACKS` — stacks checkout dir (left **empty** so the clone lands
  there); once the clone exists, every run makes it group-writable
  throughout (`chmod -R g+rwX`, setgid on dirs) and sets
  `core.sharedRepository=group`, so any admin's `--deploy` can pull it —
  the top-level 2775 alone is not enough for git
- `$SPACK_PACKAGES` — shared recipes checkout, cloned (shallow) at
  `SPACK_PACKAGES_COMMIT` from `init`; re-running `--setup` after changing
  that commit moves the checkout
- the `arch` buildcache dir — added automatically when `$SPACK_MIRROR_ARCH`
  is a `file://` URL (`/apps/software/spack/mirror-spack/build_cache`)

It also creates `/scratch/jhu` and `/scratch/schmidt` if absent, but leaves
them alone when they already exist — those are site-managed roots holding
every user's personal scratch, and re-grouping them would narrow who may
provision user directories.

Re-running `--setup` is safe and idempotent: it re-groups any existing
content that is not in `$SPACK_DEPLOY_GROUP`, re-applies setgid to
subdirectories, and makes `.spack-db` state group-writable — needed after a
deploy-group change so a colleague's installs stay manageable.

Finally it writes the shared scopes: `config.yaml` (install_tree
projections, locks), signed `mirrors.yaml`, `modules.yaml` with the
shared Lmod root and module projections, and `repos.yaml`, which points
every `-C $SPACK_SCOPE` command at the pinned recipes checkout. The same
`repos.yaml` goes into the shared admin core's site scope
(`/scratch/jhu/admin/spack/spack/etc/spack/site/`) when that core exists,
so it also holds for commands run without `-C`.

Then clone the stacks repo into the canonical checkout, and re-run
`--setup` so the checkout is writable by every admin (or, as the clone's
owner: `chmod -R g+rwX .` inside it, then
`git config core.sharedRepository group`):

```bash
git clone git@github.com:jhu-arch/arch-spack-stacks.git /apps/helpers/spack/stacks
spackon --setup
```

---

### Stage 0b — Each admin member: key setup (one-time per user)

`spackon --keys create` (ONCE only), `spackon --keys export`, then master
runs `spackon --keys trust`. Plus the GitHub SSH key authorized for the
`jhu-arch` org (see Getting Started).

`--keys export` writes **two** files: the public key into `$SPACK_KEYSPOT`
(shared, so others can trust it) and your **private** key into
`~/<user>-spack-key-compiled-v<YYYYMMDD>.priv.gpg`. Keep the private one
safe or delete it once backed up.

> **Why GPG keys?**
> The `arch` buildcache mirror is configured with `signed: true`.
> Only packages signed with a trusted GPG key can be pushed to or deployed
> from the cache.

> **Where the keys live:** spackon sets `SPACK_GNUPGHOME=~/.spack_gpg`, so
> your keyring is **outside** `$SPACK_ROOT` and outside `~/.spack`. This is
> deliberate — keys used to live in `$SPACK_ROOT/opt/spack/gpg`, where
> `spackon -r` destroyed them and `spackon -u` abandoned them (an admin
> signing key was lost this way in 2026-08). One keyring is shared by every
> spack instance you run: personal, shared scratch, and batch jobs.

---

### Stage 1 — Build in Scratch Space (any admin)

Work happens in **your working clone**, builds land in the **shared
scratch store** — nothing touches the shared install_tree yet.

```bash
spackon --admin                              # admin subshell: shared store + your working clone
spack env create gcc-12.5.0                  # stack in your clone: branch, dir from _template, era menu
spack env activate gcc-12.5.0 -p
spack add gcc@12.5.0+binutils+bootstrap %gcc@11.5.0
spack concretize -f                          # -C $SPACK_SCOPE added for you

cd /scratch/jhu/$USER                        # keep slurm-*.out out of the clone
spackon -i gcc-12.5.0 -p <partition>         # bare name → your clone; builds into the shared store
```

> The full version — `spack.yaml` contents, Slurm options and a checkpoint
> after each stage — is the worked example under
> [Getting Started](#admin-user-build-and-deploy-a-package-stacks-flow).

- The `-C $SPACK_SCOPE` concretize is what makes the lock match the shared
  tree config at deploy time.
- It also selects the **pinned recipes** (`repos.yaml` in the scope): on the
  login node or inside the job, every admin concretizes with the same
  `package.py` files, so the same `spack.yaml` gives the same hashes for
  everyone. The shared admin core carries the same pin in its own site
  scope, so commands run without `-C` — the Stage 1 build job itself — read
  the same checkout. Only a *personal* spack still uses its own
  `~/.spack/package_repos` clone.
- Build jobs run with `umask 0002`, so everything in the shared store
  stays group-writable (any admin can uninstall/rebuild).
- First admin ever: provision the shared store once with
  `spackon --admin -c` (admin-gated; also clones your working clone).
- **`--admin` replaced `export SPACK_ROOT=...`** (2026-09-21). The old
  export still works when it agrees with the mode; when it disagrees,
  spackon refuses rather than guesses — the same rule that since
  2026-08-13 refuses an empty `SPACK_ROOT` (which `export
  SPACK_ROOT=$SPACK_SCRATCH` in a login shell produced, silently selecting
  the personal spack). `unset SPACK_ROOT` is the way out of both.
- Admin-subshell rewrites, each printing the real command: `spack env
  create <name>` → `spackon --new <name>`; `spack env activate <name>` and
  `spack -e <name>` → the stack directory; `spack env list` → also your
  stacks; `spack concretize` → `-C $SPACK_SCOPE` prepended (an explicit
  `-C` is respected). Everything else passes through untouched.

---

### Stage 2 — Push to Shared Cache (admin + GPG key)

```bash
spackon --cache-push --env gcc-12.5.0        # admin mode: bare name → your working clone
```

spackon performs these checks automatically before pushing:

1. **group membership** — must be in `$SPACK_DEPLOY_GROUP`
2. **GPG signing key present** — `spackon --keys create` was run
3. **Hashes resolved against the LOCAL store** (`$SPACK_ROOT` — the
   scratch build), never against the install_tree
4. **Preview + confirmation** — shows the exact specs before signing/pushing
5. The mirror **index is updated** after the push, so `buildcache list`
   and `--deploy` see the binaries immediately

Then propose: `spackon --pr gcc-12.5.0` stages yaml + lock, commits,
pushes the branch and prints the PR URL (see Getting Started); the PR is
opened and merged in the browser. Pushing to the cache may happen before
or after the merge — the cache is content-addressed by hash; only the
**deploy** is gated on the reviewed lock.

---

### Stage 3 — Deploy to Shared Install Tree (admin + trusted key)

```bash
spackon --keys trust                       # once, before first deploy
spackon --admin --deploy --env gcc-12.5.0 -p <partition>   # pulls the canonical checkout itself
```

> **⚠ `-p` does not choose the install tree — where spackon *runs* does.**
>
> `$SPACK_ARCH_NAME`, `$SPACK_SCOPE` and `$SPACK_INSTALL_TREE` are set from
> `lscpu` **in the spackon process**, then interpolated into the
> `sbatch --wrap` as literal text before the job is queued. `-p` only picks
> the execution node. From a login node (always Intel),
> `--deploy … -p a100` deploys to **`/apps/software/spack/intel`**.
>
> To deploy the **AMD** tree, run spackon on an AMD node:
>
> ```bash
> srun -p h100 -n1 -t 15 --account=<acct> --comment=accept_cost \
>   bash -lc 'spackon --admin --deploy --env gcc-12.5.0 -p h100 \
>                     --account=<acct> --comment=accept_cost'
> ```
>
> The test is the CPU **vendor** (`AuthenticAMD`), not the
> microarchitecture — any AMD partition works (`h100`/Zen 4 as well as
> `a100`/Zen 3). Confirm on the first output line that both the stack path
> (`stacks/amd/…`) and the tree (`→ /apps/software/spack/amd`) are right.
>
> Since 2026-08-17 the job re-checks the vendor on the compute node and
> exits with `[ERROR] Architecture mismatch` instead of writing the wrong
> tree. Slurm exposes no CPU vendor (`Arch=x86_64` on every node; features
> are GPU-model tags), so the check cannot be done at submit time from a
> partition name.

**What happens:**

- The canonical checkout is fast-forwarded first (`git -C $SPACK_STACKS
  pull --ff-only`, printed as `<old> -> <new>`, run with `umask 0002`). A
  fetch failure or an unwritable `.git` only warns and the deploy continues
  with the checkout as it is (`.git` not writable = the master has not
  re-run `--setup` since the clone, see Stage 0); a merge that cannot
  fast-forward (someone edited `/apps` in place) is fatal.
- `gcc-12.5.0` is resolved to
  `$SPACK_STACKS/$SPACK_ARCH_NAME/gcc-12.5.0` and the job installs
  **exactly the hashes committed in that stack's `spack.lock`** —
  no re-concretization in the deployer's environment.
- Refused if `spack.lock` is missing, if the checkout has uncommitted
  changes to `spack.yaml`/`spack.lock` (deploys only from reviewed state),
  or if git cannot read the checkout at all — usually "dubious ownership",
  since the canonical checkout belongs to the master and the deploy runs as
  another admin. spackon refuses rather than failing open, and prints the
  `git config --global --add safe.directory …` line to fix it.
- The job runs with `umask 0002` and `SPACK_DISABLE_LOCAL_CONFIG=true`
  (the deployer's `~/.spack` is ignored — every admin's deploy behaves
  identically).
- `--use-buildcache only`: **no source compilation** — if a hash is not in
  the signed cache, the job fails.
- At the end of the deploy (once, not per package) the **shared Lmod
  module tree is refreshed** — deployed software shows up in
  `module avail`.

> **Legacy form:** `spackon --deploy --env <name>` with a name that is not
> a stack falls back to the named env in the deployer's spack and
> re-concretizes (marked `[INFO]` in the output). Prefer stacks for
> everything that goes to the shared tree.
> `spackon --deploy <pkg>@<ver>` (single spec) also still exists and also
> re-concretizes.
>
> A **directory path** is not legacy: `--deploy --env <dir>` (any directory
> holding a `spack.yaml`) is lockfile-driven too and runs the same guard.
> When the directory is outside `$SPACK_STACKS`, spackon adds a `[WARN]` —
> the stack is committed and clean, but whether it was *merged* is not
> something it can verify from a working clone. Deploy by name when you
> can; the path form is for testing a stack before the PR lands.

---

## Commands Reference

| Command | Description | Non-admin | Admin (`$SPACK_DEPLOY_GROUP`) | Master (`$SPACK_ADMIN_USER`) |
|---|---|:---:|:---:|:---:|
| `spackon` | Activate spack subshell | ✅ | ✅ | ✅ |
| `spackon -a` | Activate spack subshell (explicit form of the default) | ✅ | ✅ | ✅ |
| `spackon -c` | Install your personal spack; asks where (own or PI scratch suggested, `$HOME` fallback), remembered in `~/.spackon/config`. `spackon --admin -c` provisions the shared store and your stacks working clone (admin only) | ✅ | ✅ | ✅ |
| `spackon -i <env\|dir\|stack>` | Build packages via SLURM; accepts a named env or a stack directory; in admin mode a bare name is a stack in your working clone | ✅ | ✅ | ✅ |
| `spackon --admin` / `--personal` | Choose the store: shared build store + working clone, or your own. Accepted anywhere on the command line; inherited inside the subshell. A plain `spackon` asks deploy-group members | ❌ / ✅ | ✅ | ✅ |
| `spackon --admin --new <name>` | Create stack `<name>` in your working clone: branch `add-<name>` from `origin/main`, dir from `_template`, era include from a menu. Inside the admin subshell `spack env create <name>` does the same | ❌ | ✅ | ✅ |
| `spackon --admin --pr <name>` | Propose the stack: asks whether you tested it, stages only yaml + lock (refuses missing/stale lock), commits `<arch>: add <name>`, pushes `add-<name>`, prints the PR URL. Open/merge in the browser | ❌ | ✅ | ✅ |
| `spackon -r` | Remove your personal spack (confirms first) | ✅ | ✅ | ✅ |
| `spackon -u [dev]` | Update spack (backs up as `spack.<mon><DD>.<YYYY>`) | ✅ | ✅ | ✅ |
| `spackon -e <path>` | Move your environments to another path | ✅ | ✅ | ✅ |
| `spackon -m <file>...` | Merge YAML files (later files override earlier) | ✅ | ✅ | ✅ |
| `spackon --keys list/trust` | List / trust GPG keys | ✅ | ✅ | ✅ |
| `spack install --use-buildcache prefer <pkg>` | Install from shared cache, build if not cached | ✅ | ✅ | ✅ |
| `spackon -f [base_path]` | Find and register external packages / compilers | ❌ | ✅ | ✅ |
| `spackon --keys create/export` | Create / export GPG signing key | ❌ | ✅ | ✅ |
| `spackon -i -arch` | Build directly into shared install_tree (legacy; prefer stacks) | ❌ | ✅ | ✅ |
| `spackon --cache-push <pkg>@<ver>` | Push from the local store to arch cache | ❌ | ✅ | ✅ |
| `spackon --cache-push --env <stack\|dir\|env>` | Push all packages of a stack/env to cache (`--private`: non-redistributable recipes such as Intel oneAPI are included — the ARCH mirror is cluster-internal) | ❌ | ✅ | ✅ |
| `spackon --deploy --env <stack\|dir>` | **Lockfile-driven deploy** from cache → tree (SLURM); same guard for a name or a directory; a bare name first fast-forwards the canonical checkout | ❌ | ✅ | ✅ |
| `spackon --deploy <pkg>@<ver>` | Deploy a single spec (re-concretizes; legacy) | ❌ | ✅ | ✅ |
| `spackon -i -push` / `-i -arch-push` | Build + push to cache (SLURM) | ❌ | ❌ | ✅ |
| `spackon --setup` | Create all shared dirs + scope files, clone or move the pinned recipes checkout (sudo) | ❌ | ❌ | ✅ |
| `spackon --pin-compiler <spec>` | Declare an already deployed compiler as an external in both shared scopes (`buildable: false`), so its bootstrap graph stops leaking into later builds. Additive; refuses a compiler that is not installed. Knows the GNU and the Intel oneAPI layouts (`gcc@12.5.0`, `intel-oneapi-compilers@2026.1.0`). | ❌ | ✅ | ✅ |
| `spackon --unpin-compiler` | Re-enable compiler builds in the shared scopes, keeping the externals. Needed once per new compiler era. | ❌ | ✅ | ✅ |

`-i` and `--deploy` both take `-p <partition>` and `-t <limit>`, and forward
every other option to `sbatch` untouched (`--account=`, `--comment=`,
`--mem=`, …). Defaults: `-c 8 -t 240`, with `spack install -j 8`.

> `spackon -up` exists but runs in a child process, so it cannot load spack
> into your current shell — use `spackon` (subshell) or source
> `$SPACK_ROOT/share/spack/setup-env.sh` directly.

---

## Config Scopes

Config scopes live in `/apps/helpers/spack/` — shared across all admins,
preserved across spack updates.

```bash
spack -C $SPACK_SCOPE config get config    # verify install_tree
spack -C $SPACK_SCOPE find -pl             # find installed packages
spack -C $SPACK_SCOPE concretize -f        # concretize environment
```

`{intel,amd}/config.yaml` — written by `spackon --setup`:

```yaml
config:
  sbang_path: ${SPACK_ROOT}/bin
  install_tree:
    root: /apps/software/spack/intel
    projections:
      all:  "{compiler.name}/{compiler.version}/{name}/{version}-{hash:7}"
      ^mpi: "{compiler.name}/{compiler.version}/{name}/{version}-{hash:7}/{^mpi.name}/{^mpi.version}"
  locks: true                 # prevent DB corruption during concurrent builds
  db_lock_timeout: 120        # wait up to 120s for lock before failing
  package_lock_timeout: null
  allow_sgid: true            # keep setgid on the shared trees
  build_jobs: 8
  shared_linking:
    type: rpath
```

> **No `padded_length`** — site decision, 2026-08-10: readable prefixes were
> preferred over relocation headroom. Relocating cache binaries into
> `/apps/software/spack/{intel,amd}` still works because that prefix is
> **shorter** than the scratch build prefix. The standing constraint: never
> deploy cache binaries to a prefix *longer* than their build path.

`{intel,amd}/modules.yaml` — the shared Lmod root is what makes deploy-time
module refresh land in the shared tree instead of the deployer's home:

```yaml
modules:
  default:
    roots:
      lmod: /apps/software/spack/intel/modulefiles/lmod
    enable: [lmod]
    lmod:
      core_compilers: ['gcc@11.5.0', 'gcc@10.3.0', 'gcc@9.3.0']
      core_specs: ['intel-oneapi-compilers']   # a compiler not bootstrapped by a core compiler still sits in Core, next to gcc
      hash_length: 0
      exclude_implicits: true   # only explicitly-installed packages get modules
      hierarchy: [mpi]
      projections:
        all:  '{name}/{version}'
        ^mpi: '{name}/{version}/{^mpi.name}/{^mpi.version}'
      all:
        autoload: direct
```

> **Plain module names** — site decision, 2026-08-12, same naming as the
> personal tree. The Lmod hierarchy already records which compiler built a
> package (`zlib/1.3.1` only appears after `module load gcc/12.5.0`), so the
> compiler prefix and hash stay out of module names. Install *prefixes* keep
> `{hash:7}`, so variants never overwrite on disk. If two explicit variants
> of the same `name@version` ever collide in one hierarchy branch, `module
> lmod refresh` aborts loudly — give the extra variant a suffixed projection
> (e.g. `openmpi+cuda: '{name}/{version}-cuda'`), not a hash.

`{intel,amd}/repos.yaml` — written by `spackon --setup` since 2026-09-16:

```yaml
repos:
  builtin:
    git: https://github.com/spack/spack-packages.git
    commit: a356f982cfedc4670ab00261d65f9812e1418765   # SPACK_PACKAGES_COMMIT in init
    destination: /apps/helpers/spack/packages          # SPACK_PACKAGES in init
```

> **Why the recipes are pinned.** Spack 1.x keeps the builtin recipes
> (`package.py` files) in a git clone it makes **per user** — under
> `~/.spack/package_repos/` on the login node, under the job's
> `SPACK_USER_CACHE_PATH` inside Slurm — on the day that user first runs
> spack, and never refreshes it. Recipes are part of a package's hash, so
> two admins with clones from different days get different hashes for the
> same `spack.yaml`, and a clone older than the shared core cannot even load
> some recipes (`cannot load package 'openblas' ... No module named
> 'spack.llnl'`, seen 2026-09-16). `destination` makes every `-C` command
> read one shared checkout; `commit` is what `--setup` checked out there.
> The recipes commit is now a site decision, like the compiler era: new
> upstream versions become visible only after a bump.
>
> **To bump the recipes:** the master edits `SPACK_PACKAGES_COMMIT` in
> `/apps/helpers/spack/init` (a full 40-character SHA that exists upstream
> and fits the shared core's package-API window), then re-runs
> `spackon --setup`, which fetches that commit and moves the checkout.
> Deployed packages do not change; stacks re-concretized afterwards may get
> new hashes, exactly as happened silently before.
>
> **Also in the admin core.** `--setup` writes the same file into
> `/scratch/jhu/admin/spack/spack/etc/spack/site/repos.yaml`, the site scope
> of the shared admin core. That scope is read by every command run with
> that core, `-C` or not, and it is not disabled by
> `SPACK_DISABLE_LOCAL_CONFIG` — so the Stage 1 build job (which runs
> without `-C`) and an interactive `spack info` read the pinned checkout
> too. Personal spacks have their own `etc/spack/site` and are unaffected.
> `spackon -u` on the admin core re-clones it and drops the file: re-run
> `--setup` after any update of the admin core.
>
> **Check:** `git -C /apps/helpers/spack/packages rev-parse HEAD` must match
> the `commit:` line; `spack -C $SPACK_SCOPE repo list` must show
> `/apps/helpers/spack/packages/repos/spack_repo/builtin`; inside the admin
> core, plain `spack repo list` must show the same path.

---

## Mirrors

Mirror paths are configured in one place: `/apps/helpers/spack/init` →
scope `mirrors.yaml`. Personal spacks get a **symlink**
(`~/.spack/mirrors.yaml → $SPACK_SCOPE/mirrors.yaml`), so edits propagate
to all users automatically.

| Mirror         | Path                                                | Signed |
|----------------|-----------------------------------------------------|--------|
| `spack-public` | `https://mirror.spack.io`                           | yes    |
| `arch`         | `/apps/software/spack/mirror-spack/build_cache`     | yes    |

```bash
spack -C $SPACK_SCOPE mirror list
spack -C $SPACK_SCOPE buildcache list python
```

> `signed: true` enforces GPG verification before any package enters the
> shared install_tree.

---

## GPG Key Management

```bash
spackon --keys create      # once per admin (spack mishandles duplicates)
spackon --keys export      # public key → $SPACK_KEYSPOT, private key → ~/
spackon --keys trust       # trust all exported keys (before cache use)
spackon --keys list
```

`create` and `export` require `$SPACK_DEPLOY_GROUP` membership; `list` and
`trust` are open to any user. The keyring lives in `~/.spack_gpg`
(`$SPACK_GNUPGHOME`), outside `$SPACK_ROOT` — see Stage 0b.

---

## What Keeps install_tree Clean

| Risk                              | Protection                                                                          |
|-----------------------------------|-------------------------------------------------------------------------------------|
| Unreviewed change lands in tree   | **Lockfile-driven deploy**: `--deploy --env <stack>` installs only hashes committed in `spack.lock`, merged via PR (≥1 approval) |
| Deploy from locally edited stack  | spackon refuses stacks with missing/uncommitted `spack.yaml`/`spack.lock`, and refuses when git cannot read the checkout — for **both** the `--env <name>` and `--env <dir>` forms |
| Stack deployed before its PR merged | Not blocked, but flagged: deploying a directory outside `$SPACK_STACKS` prints a `[WARN]` — committed and clean is verifiable, *merged* is not |
| Broken build lands in tree        | `--use-buildcache only` — only pre-built binaries deploy, no source compilation     |
| Unsigned package sneaks in        | `signed: true` on `arch` mirror — spack rejects unsigned cache entries              |
| "Concretized differently for me"  | Deploy/`-arch` jobs run with `SPACK_DISABLE_LOCAL_CONFIG=true` — the admin's `~/.spack` never participates |
| Admin A's files locked for admin B| Jobs run with `umask 0002`; `packages:all:permissions` (write: group) in `common/packages-common.yaml` |
| Concurrent install corruption     | `locks: true`, `db_lock_timeout: 120` in scope `config.yaml`                        |
| Relocation breakage scratch→/apps | The `/apps` prefix is **shorter** than the scratch build prefix, so binaries relocate without padding. Constraint: never deploy to a prefix longer than the build path (no `padded_length` since 2026-08-10) |
| Signing key lost to `spackon -r`  | `SPACK_GNUPGHOME=~/.spack_gpg` — the keyring lives outside `$SPACK_ROOT` and outside `~/.spack`                                     |
| Random user writes to tree        | `chmod 2775` + `$SPACK_DEPLOY_GROUP` group ownership — non-members cannot write     |

> **What this table does *not* claim.** These protections describe the
> recommended route, `--deploy --env <stack-name>`. Three commands still
> reach the shared tree without a reviewed lock, by design, and are the
> deploy group's responsibility to use sparingly:
>
> | Route | What it skips |
> |---|---|
> | `spackon --deploy <pkg>@<ver>` | no stack, no lock — re-concretizes against the shared scope |
> | `spackon --deploy --env <name>` where `<name>` is not a stack | falls back to a named env in the deployer's spack and re-concretizes (`[INFO]` in the output) |
> | `spackon -i -arch` | builds **from source** straight into the shared tree; no cache, no lock, no PR |
>
> All three still require deploy-group membership and a trusted key, and the
> two `--deploy` forms still install signed binaries only. What they skip is
> the *review*, not the *provenance*. Restricting shared deploys to the stack
> form is tracked as IMPROVEMENTS H8.

---

## Admin Operations (`help-admin`)

### Layer 1 — Filesystem security

Unchanged: `chmod 2775` + setgid on the shared trees, verify with
`stat <tree> | grep Access` (expect `drwxrwsr-x`).

### Layer 2 — Spack mirror security

Unchanged: `signed: true` on the `arch` mirror in both scopes.

### umask

Build and deploy **jobs set `umask 0002` themselves** (inside the sbatch
wrap), so files created in shared trees are group-writable regardless of
where the job was submitted from. The spackon subshell also sets it for
interactive work. Additionally, `common/packages-common.yaml` in the
stacks repo sets `packages:all:permissions` (read world / write group), so
Spack enforces group-manageable files independent of umask.

---

## CI vs SLURM: Build Cache Approach

> **Note — to evaluate:** unchanged from the original document. The
> stacks repo is a natural stepping stone to a CI-driven flow (a runner
> could build+push on PR merge), but today builds go through SLURM.

---

## Identifying Intel vs AMD via Modulefile

Unchanged from the original document — the module system detects the CPU
vendor at load time (`lscpu`) and selects the matching spack scope; since
2026-09-23 the same test runs at login in `/apps/Lmod` and picks which
tree's `Core` sits on the base `MODULEPATH` (intel or amd, never both);
spackon exposes the same detection as `$SPACK_ARCH_NAME`
(`intel`/`amd`), which is also the stacks subdirectory the deploy
resolves against.

The difference that matters for admins: the *modulefile* runs its detection
on the node where the user loads the module, so it is always right. spackon
runs its detection **once, in its own process**, and then hands the result
to a Slurm job that may execute somewhere else entirely — so a deploy
targets the tree of the *submitting* host. Populating both trees means
running spackon twice, once on a node of each vendor. See the warning in
Stage 3.

**The amd gcc module ships with the intel branch attached (2026-08-19).**
`intel` is the default tree — most software deploys there only; `amd` gets
just the packages that profit from tuning. So the amd scope's `modules.yaml`
(written by `--setup`) gives the amd tree's `gcc/12.5.0` module an extra
`append_path("MODULEPATH", <intel gcc branch>)`: on an AMD node the amd
branch is prepended (wins name/version ties) and everything not deployed to
amd falls back to the intel tree automatically. Do not hand-edit the
generated `.lua` — every deploy's module refresh would silently drop the
edit; the block lives in the scope `modules.yaml`, and it is `append_path`,
not `prepend_path`, deliberately: config environment entries execute after
the module's own-branch prepend, so a prepend would put intel *in front* of
amd and invert the tie-winner (IMPROVEMENTS C4). Keep dual-tree packages at
the **same version** in both trees: Lmod resolves a bare `module load name`
to the highest version visible anywhere; `MODULEPATH` order only breaks
exact name/version ties.

> **Done 2026-09-23 (C3.3):** the users' default `MODULEPATH` carries the
> shared module roots — one vendor-matched `Core`, chosen by `lscpu` in the
> site shell init `/apps/Lmod` and placed in the base `MODULEPATH` (survives
> `module purge`; `module reset` restores it). It went in after the amd gcc
> module already carried the fallback above, so AMD users never lost the
> intel-only software. `/apps/lmod/site/SitePackage.lua` titles the spack
> branches `gcc/12.5.0 (intel)`, `openmpi/5.0.10/gcc/12.5.0 (intel)`, … with
> one generic rule (no per-version entry when a compiler or MPI is added).
> Backups: `/apps/lmod/site/{Lmod,SitePackage.lua}.bak.23Sep26`.

---

## See Also

- `github.com/jhu-arch/arch-spack-stacks` — the stacks repository (README
  has the full 7-step workflow)
- [Spack documentation](https://spack.readthedocs.io)
- [Spack buildcache guide](https://spack.readthedocs.io/en/latest/binary_caches.html)
- [Spack environments / lockfiles](https://spack.readthedocs.io/en/latest/environments.html)
- `SpackON_sharepoint.md` — the pre-stacks revision of this document
