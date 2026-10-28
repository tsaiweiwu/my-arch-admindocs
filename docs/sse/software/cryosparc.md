# CryoSPARC on Apptainer

!!! info "Lab guide"
    What PIs and lab members see is the public [CryoSPARC tutorial](https://docs.arch.jhu.edu/en/latest/3_Tutorials/specialized/Tutorial_CryoSPARC.html).
    A copy is installed as `/apps/software/cryosparc/README-user.md`.

Installer/manager for per-lab CryoSPARC instances (Skipjack nodes, plus `devcryo` for single-host mode),
running master and worker in Apptainer containers.

## Layout

| File | Role |
|---|---|
| `cryosparc.sh` | CLI + menu: install, run, versions/update, backup/restore, Slurm lane, systemd unit, image build |
| `README-user.md` | What a PI needs: setup, daily use, versions, backup; install next to the images |
| `examples/lane-a100/` | A working cluster lane (info + script, placeholders); install next to the images |
| `slurm-apptainer.sh` | Per-host helper that puts the host Slurm client (binaries, munge, configless cache, `rates.lua`/`qos_config.lua`, and the libraries `srun`'s MPI plugin needs: libhwloc, libpmix, libevent, found with `ldd` on the host) into `APPTAINER_BIND` and the Slurm bin dir on the container PATH (`APPTAINERENV_PREPEND_PATH`, `SLURM_BIN_DIR` overrides); used by `SLURM_MODE=bind` and by the OnDemand VNC apps (sj_desktop, sj_totalview, sj_matlab) so their desktop terminal has `squeue`/`sbatch`; install as `/apps/helpers/slurm-apptainer.sh` |
| `container/cryosparc-base.def` / `Dockerfile.base` | Phase 1 image: OS + deps only |
| `container/cryosparc-image.def` / `Dockerfile.image` | Phase 2 image: CryoSPARC baked in, one per version |
| `container/cryosparc-entrypoint` | Foreground entrypoint for `apptainer run` under systemd |
| `container/image-finalize.sh` | Strips license/state from the phase 2 image |

## Where things live

| Path | Mode | Content |
|---|---|---|
| `/apps/helpers/cryosparc.sh`, `slurm-apptainer.sh` | 755 | the CLI and the Slurm bind helper |
| `/apps/software/cryosparc/` (`CS_IMAGES_DIR`) | 755, images 644 | `cryosparc-base.sif` (OS + libs), one `cryosparc-X.Y.Z.sif` per CryoSPARC version, and [the lab guide](https://docs.arch.jhu.edu/en/latest/3_Tutorials/specialized/Tutorial_CryoSPARC.html) (installed here as `README-user.md`) (the lab guide; `help` points to it); every lab reads them |
| `/apps/software/source/cryosparc/` | 750, admin only | `admin.ini` (root's config: license, `SRC_DIR`), `cryosparc-apptainer/` with this README and the recipes (`CS_CONTAINER_DIR` = its `container/`) |

One master per lab: each PI runs their own, as their own account, with their own database, license and CryoSPARC
version. The version is the image: an admin runs `freeze X.Y.Z` once per release, the PI picks it with
`init X.Y.Z` (new lab) or `update X.Y.Z` (existing lab); `versions` lists what is there. Forward only: a newer
version migrates the database on its first start, and an older image will not start on a migrated database.
The version images contain CryoSPARC code (license ID removed): internal tree only, never a public registry.

Config per lab: `~/.cryosparc/<group>.ini` (mode 600, **no passwords stored**). Select another with `CS_CONF=...`.
As root (image builds) the config is `/apps/software/source/cryosparc/admin.ini` (`CS_ADMIN_CONF`), shared by every
admin and node; set `SRC_DIR` there to a large admin-only directory (tarballs + staged installs, which carry the
admin license until `freeze` strips it).
`DRY_RUN=1 ./cryosparc.sh <cmd>` prints the commands without running them.

## Modes

- `MODE=cluster`: master in a container; each job is an `sbatch` that runs `apptainer exec --nv` (Slurm allocates GPUs).
  Submission from inside the master container: `SLURM_MODE=ssh` (default, `ssh` to `SLURM_SUBMIT_HOST`) or `bind` (host Slurm client bind-mounted through `APPTAINER_BIND`, which a per-host helper sets: `SLURM_APPTAINER_HELPER`, default `/apps/helpers/slurm-apptainer.sh`, template `slurm-apptainer.sh` in the source repo; the binds belong to the host, so they are not kept in the `.ini`).
- `MODE=single`: master and worker on the same host (`devcryo`). CryoSPARC launches jobs as local subprocesses, so they run **inside the master container** (`--nv`).

## One image, two containers

Each version has **one image** (`cryosparc-X.Y.Z.sif`) holding both `cryosparc_master` and `cryosparc_worker`:

```
/apps/software/cryosparc/
├── cryosparc-base.sif          OS + libraries only, no CryoSPARC: the starting point of every freeze
├── cryosparc-5.0.7.sif         one per CryoSPARC version; old ones stay until no lab runs them
│   └── /opt/cryosparc/
│       ├── cryosparc_master/   bin/cryosparcm, database, web app, scheduler
│       └── cryosparc_worker/   bin/cryosparcw, CUDA, ctffind, gctf
├── examples/
└── README-user.md
```

What is separate is the **container**, not the image:

- **Master:** a long-running `apptainer instance`, managed by systemd.
- **Worker:** one `apptainer exec --nv` per job, launched by the lane's `sbatch`. In `single` mode (`devcryo`) the worker runs inside the master container.

Why one image:

- Master and worker must be on exactly the same version; a single image makes a 5.0.1 master with a 5.0.0 worker impossible.
- In `single` mode the master launches the worker as a local subprocess, so the worker has to exist inside the master container anyway.
- The extra size is irrelevant: the `.sif` lives on the shared filesystem and is read on demand.

Splitting into master and worker images only pays off if workers run where size or dependencies are constrained (different driver/CUDA, registry limits).

## Where each step runs

| Step | GPU node? | Why |
|---|---|---|
| `build-base`, `freeze` (image build) | No | Image has no driver/CUDA; `--nv` injects the host driver at run time. Needs `apptainer` + subuid/subgid for `--fakeroot`. |
| `install-master`, `stage` (installs master **and** worker), `install-worker` | No | Since v4.4 the worker bundles CUDA; no local toolkit (`--cudapath`) needed. |
| `install-single`, `init`/`migrate` in `MODE=single` | **Yes** | `cryosparcw connect` detects the GPUs of the host it registers. |
| Jobs (`MODE=cluster`) | Allocated by Slurm | The lane `sbatch` requests `--gres=gpu:N`. |

GPU access is always `--nv` (host driver mounted at run time). Never put driver or CUDA toolkit in the image: the driver must match the host kernel module, and the CryoSPARC worker bundles its CUDA runtime. The lane passes Slurm's `CUDA_VISIBLE_DEVICES` explicitly because `--cleanenv` drops it.

## Phase 1 — base image, CryoSPARC in the lab directory

```bash
sudo /apps/helpers/cryosparc.sh build-base 9   # once, as root (OS_RELEASE = node major release): IMAGES_DIR is root-writable,
                                               # and an unprivileged build loses the admin group inside its namespace
./cryosparc.sh config                # DEST, PORT, LICENSE_ID, MODE, PARTITION...
./cryosparc.sh install-master        # or install-single on a GPU node
./cryosparc.sh install-worker        # MODE=cluster: install or repair the worker of an existing master
./cryosparc.sh status | open | passwd | update 5.0.2
```

Existing installs (e.g. `devcryo`): no reinstall needed. Point `DEST` at the current install, then:

```bash
# .ini must set RUN_USER=ext-csgbhabha RUN_GROUP=gbhabha1
CS_CONF=/root/cryosparc/gbhabha1.ini ./cryosparc.sh systemd-unit > /etc/systemd/system/cryosparc-gbhabha1.service
```

The generated unit uses `Type=simple` + `apptainer run`, `TimeoutStartSec=900`, and does not depend on the
CryoSPARC systemd template (which went stale after the v5 update).

## Phase 2 — one immutable image per version

```bash
sudo /apps/helpers/cryosparc.sh freeze 5.0.7   # root: stage install AT /opt/cryosparc + build /apps/software/cryosparc/cryosparc-5.0.7.sif
./cryosparc.sh versions                # PI: images available, which one this lab runs (--remote asks CryoSPARC for newer releases)
./cryosparc.sh init 5.0.7              # admin (sudo -u <pi>), new lab (a path to a .sif also works)
./cryosparc.sh migrate 5.0.7           # admin (sudo -u <pi>), existing phase 1 lab
./cryosparc.sh update 5.0.8            # PI: swaps the image; DB migrates on first start
./cryosparc.sh backup [DIR]            # PI: database dump (.archive) while running; default $DEST/backups
./cryosparc.sh restore FILE            # PI: database restore while stopped, then start
```

`backup` is the database only (projects are the lab's own directories) and is consistent with the projects as
they were at that moment; CryoSPARC advises against restoring a backup older than the project directories.
The path must be under `DEST` or a project dir (what the master container can see).

Per lab, only state is bind-mounted: `config.sh` (license), `run/`, database, SSD cache and projects.
Anything else CryoSPARC writes into the install tree lands in a per-version overlay (`OVERLAY_MODE=dir`).
`./cryosparc.sh discover` lists those writes; promote the relevant ones to binds, then switch to `OVERLAY_MODE=tmpfs`.

The phase 2 image contains licensed code: **private registry only**.

## Apptainer and enroot from the same image

A `.sif` is Apptainer-only; enroot imports only OCI images. To use both runtimes, make the OCI image
(built from the `Dockerfile`s) the single source and derive `.sif` and `.sqsh` from it.

```bash
# Placeholder registry: replace with your PRIVATE registry (phase 2 image contains licensed code).
REG=registry.example.org/arch

# The stage must be inside the build context (container/); symlinks are not followed.
./cryosparc.sh stage 5.0.1
rsync -a ~/.cryosparc/src/stage/v5.0.1/ container/stage/v5.0.1/

podman build -f container/Dockerfile.base -t $REG/cryosparc-base:rocky9 container/
podman build -f container/Dockerfile.image --build-arg BASE=$REG/cryosparc-base:rocky9 \
             --build-arg STAGE=stage/v5.0.1 --build-arg VERSION=5.0.1 \
             -t $REG/cryosparc:5.0.1 container/
podman push $REG/cryosparc:5.0.1

# Each runtime pulls from the same source
apptainer build cryosparc-5.0.1.sif docker://$REG/cryosparc:5.0.1
enroot import -o cryosparc-5.0.1.sqsh docker://$REG/cryosparc:5.0.1
```

`cryosparc.sh` currently drives **Apptainer only**. Under enroot: no `instance` (run the master with
`enroot start` in a `Type=simple` unit; the entrypoint already holds the foreground), binds become
`--mount src:dst`, and the Slurm lane needs **pyxis** (`srun --container-image=...`).

## Labs on this cluster

**Access through OnDemand.** Interactive Apps > CryoSPARC on the OnDemand portal starts a VNC session whose only
window is Firefox (module `Firefox/153.5`) on the master the user picks; the Keycloak login of OnDemand, then the
lab's CryoSPARC login. The web interface cannot go through the node proxy (blank page under `/rnode/`) and the
login nodes refuse SSH port forwarding, so this is the way in. The form's list is
`${BASE_ETC}/ood/config/apps/sj_cryosparc/labs.yml` on the OnDemand host (PI, manager, account, host, port,
the table above without the license column); keep it in step with this table. See
`ondemand/apps.d/sj_cryosparc/README.md`.

**Access by SSH tunnel.** `cryosparc.sh open` prints `ssh -N -L PORT:<host>:PORT <user>@<LOGIN_HOST>`
(default `login01.<affiliation domain>`, the host app.GUI's VNC tunnels go through). Observed on 2026-10-26: an
app.GUI tunnel through `login01.schmidtsciences.jhu.edu` to `csr071:5902` worked, and a tunnel through
`login02.arch.jhu.edu` to `csr057:25000` got `channel open failed: administratively prohibited`. What made the
difference (login node, user, destination port, or a `Match` block) is not established. To find out, run on
each login node `sshd -T -C user=<user>,host=<client>,addr=<client ip> | grep -iE
'allowtcpforwarding|permitopen|disableforwarding'`, which applies the `Match` blocks for that user. Do not
answer it with a `PermitOpen` list of CryoSPARC masters: that list would also govern app.GUI's VNC tunnels
(`<node>:59NN`).

**Creating a lab (admin).** `init` and `migrate` refuse a plain user: they run as root or as an admin via
`sudo -u <pi>`, so the files, the process and the license belong to the lab. On the lab's host:

```bash
sudo -u <pi> /apps/helpers/cryosparc.sh config        # license, DEST, PROJECT_DIRS, PORT, ACCOUNT, RESERVATION
sudo -u <pi> /apps/helpers/cryosparc.sh init 5.0.7    # installs, starts, prints the admin password once
```


One master per lab, started by the PI (or the lab's manager) with their own license; it stops only for
`update` and comes back on the same port. Masters are hosted on a node of the CryoSPARC Slurm
reservation or on a dedicated node, never on the login nodes. `RESERVATION` in the `.ini` sends the lane's
jobs to a reservation (blank for none); a job in a reservation runs only on its nodes, so it must hold nodes
of the lane's partitions: a reservation that holds only the master hosts (one CPU node) gives GPU jobs
nowhere to run. Ports are assigned here, one hundred apart,
below the kernel's ephemeral range (32768-60999, which CryoSPARC refuses). The Slurm account is a
ColdFront **paid allocation** of the PI's project with abbreviation `cryosparc`, so it is named
`<pi>_cryosparc` (the former `cryo-<pi>` accounts are not used); it exists once the allocation is
approved with a pay IO and a decided spending cap.

| PI | Manager | Slurm account (`ACCOUNT`) | `PORT` |
|---|---|---|---|
| test lab (ARCH) | S. Ponomarev | `sjadmin` | 25000 |
| Gira Bhabha | Nicolas Coudray | `gbhabha1_cryosparc` | 25100 |
| Cynthia Wolberger | Sanim Rahman | `cwolber1_cryosparc` | 25200 |
| Albert Lau | Albert Lau | `alau4_cryosparc` | 25300 |
| Ed Twomey | Lucas Dillard | `etwomey1_cryosparc` | 25400 |
| Yuan He | Avinash Patel | `yhe116_cryosparc` | 25500 |
| Jungsan Sohn | Shuai Wu | `jsohn10_cryosparc` | 25600 |
| James Berger | Dan Richman | `jberger29_cryosparc` (confirm the PI's JHED) | 25700 |
| Chang Liu | Chang Liu | `cliu207_cryosparc` | 25800 |
| Scott Bailey | Scott Bailey | `sbaile21_cryosparc` (confirm the PI's JHED) | 25900 |
| Jamie Spangler | Sonya Kumar | `jspangl4_cryosparc` | 26000 |

License IDs are credentials: they live in the lab's `.ini` and in ColdFront, never in git or these docs. E-mails are in ColdFront. The earlier
39000-39900 plan was dropped: every one of those ports is inside the ephemeral range. The lab guide
(`README-user.md`, world-readable) shows this table with placeholder names.

## Operational notes

- **Run-as account:** set `RUN_USER`/`RUN_GROUP` in the lab `.ini` (e.g. `ext-csgbhabha`/`gbhabha1`). `systemd-unit` refuses to generate a unit that runs as root.
- **Groups/SSSD:** no SSSD inside the container. Supplementary groups are kernel credentials set by systemd/slurmd (via host SSSD) and inherited; Apptainer writes your user and groups into the container `/etc/passwd`/`/etc/group`. Groups are fixed at start: restart the master after group changes. The unit orders after `sssd.service`. Check inside the container: `id; grep Groups /proc/self/status`.
- **Unique `PORT` per lab, fixed once the lab exists:** `start` aborts if anything listens in `PORT..PORT+10`. `PORT` in the `.ini` is written into the master `config.sh` (`CRYOSPARC_BASE_PORT`) only while the lab has no database yet; after the first start the database keeps the port too (MongoDB replica set member `<host>:<port+1>`), so `start` refuses a different `PORT` instead of leaving mongod without a primary. `init` refuses a `DBPATH` that already holds a database and stops a leftover instance first; redo a failed `init` by moving `DEST` aside.
- **Private `/tmp` per lab** (`TMP_DIR`, default `/tmp/cryosparc-<NAME>-<user>`): in phase 2 all labs share the install path `/opt/cryosparc`, so a shared `/tmp` could mix their sockets/locks.
- **Patch master and worker together.** The worker must match the master's version AND patch (`v5.0.7` vs `v5.0.7+260921` fails every job at start). `cryosparcm patch` does not reach a cluster worker: `cryosparcm patch --download` (add `--force` when the master already has the latest patch) writes `cryosparc_master_patch.tar.gz` and `cryosparc_worker_patch.tar.gz` into `cryosparc_master/`; `cryosparcm patch --install` + `cryosparcm restart` patch the master; copy the worker file into `cryosparc_worker/` and run `bin/cryosparcw patch` there, inside the base image. The `version` file does not show the patch.
- **Under systemd, stop with `systemctl stop`.** A manual `cryosparcm stop` makes the entrypoint exit and `Restart=on-failure` brings it back.
- **Phase 2 `config.sh` is a bind-mounted file:** commands that rewrite it by rename (e.g. `cryosparcm changeport`) fail inside the container; edit `state/master.config.sh` on the host instead.
- **`SSDPATH` in `MODE=cluster`** should be node-local scratch on the GPU nodes, not WEKA (or GPFS on Rockfish).

## Fixes to the 2023 script

- `$dDESTINATIO` typo (tunnel file written to `/`).
- `SSDPAT=` typo (`SSDPATH` never updated).
- `[ -f "~/.CryoSparc.ini" ]` never expanded `~`.
- Password stored in plain text and printed: now shown once at install, never stored; `passwd` reads it silently.
- `rm -rf $DEST/...` without guard: `safe_rm` refuses paths outside `DEST`.
- Update fetched `worker-latest`: now the exact version for master and worker.
- `createuser` ran before the database was up.
- `VERSION=4.4.0` hard-coded in 4 places; `*gpu*` hostname check replaced by `nvidia-smi`.

## Validate before production

- Versioned download URL `get.cryosparc.com/download/{master,worker}-vX.Y.Z/<license>` (pre-placed tarballs in `SRC_DIR/vX.Y.Z/` skip the download).
- v5 `install.sh` flags (`--hostname`, `--dbpath`, `--port`, `--standalone`) on a test install.
- Unprivileged directory overlay requires Apptainer ≥ 1.1 with `fuse-overlayfs`; otherwise use `OVERLAY_MODE=tmpfs`.
- `--fakeroot` build needs subuid/subgid for the building user.
