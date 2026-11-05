# CryoSPARC on Apptainer

<div id="cryosparc-tabs" markdown="block">

<div markdown="block">

## Admin guide

Installer/manager for per-lab CryoSPARC instances (Skipjack nodes, plus `devcryo` for single-host mode),
running master and worker in Apptainer containers.

### Layout

| File | Role |
|---|---|
| `cryosparc.sh` | CLI + menu: install, the master's Slurm job (`master.sbatch`, `master-job`), stop/status, versions/update, backup/restore, Slurm lane, image build |
| `README-user.md` | What a PI needs: setup, daily use, versions, backup; install next to the images |
| `examples/lane-a100/` | A working cluster lane (info + script, placeholders); install next to the images |
| `slurm-apptainer.sh` | Per-host helper that puts the host Slurm client (binaries, munge, configless cache, `rates.lua`/`qos_config.lua`, and the libraries `srun`'s MPI plugin needs: libhwloc, libpmix, libevent, found with `ldd` on the host) into `APPTAINER_BIND` and the Slurm bin dir on the container PATH (`APPTAINERENV_PREPEND_PATH`, `SLURM_BIN_DIR` overrides); used by `SLURM_MODE=bind` and by the OnDemand VNC apps (sj_desktop, sj_totalview, sj_matlab) so their desktop terminal has `squeue`/`sbatch`; install as `/apps/helpers/slurm-apptainer.sh` |
| `container/cryosparc-base.def` / `Dockerfile.base` | Phase 1 image: OS + deps only |
| `container/cryosparc-image.def` / `Dockerfile.image` | Phase 2 image: CryoSPARC baked in, one per version |
| `container/cryosparc-entrypoint` | The images' foreground entrypoint (`apptainer run`); `cryosparc.sh` does not use it: its `master-job` holds the master's Slurm job the same way |
| `container/image-finalize.sh` | Strips license/state from the phase 2 image |

### Where things live

| Path | Mode | Content |
|---|---|---|
| `/apps/helpers/cryosparc.sh`, `slurm-apptainer.sh` | 755 | the CLI and the Slurm bind helper |
| `/apps/software/cryosparc/` (`CS_IMAGES_DIR`) | 755, images 644 | `cryosparc-base.sif` (OS + libs), one `cryosparc-X.Y.Z.sif` per CryoSPARC version, and `README-user.md` (the [lab guide](#users); `help` points to it); every lab reads them |
| `/apps/software/source/cryosparc/` | 750, admin only | `admin.ini` (root's config: license, `SRC_DIR`), `cryosparc-apptainer/` with its `README.md` (the source of this section) and the recipes (`CS_CONTAINER_DIR` = its `container/`) |

One master per lab: each PI runs their own, as their own account, with their own database, license and CryoSPARC
version. The version is the image: an admin runs `freeze X.Y.Z` once per release, the PI picks it with
`init X.Y.Z` (new lab) or `update X.Y.Z` (existing lab); `versions` lists what is there. Forward only: a newer
version migrates the database on its first start, and an older image will not start on a migrated database.
The version images contain CryoSPARC code (license ID removed): internal tree only, never a public registry.

Config per lab: `~/.cryosparc/<pi>.ini` (mode 600, **no passwords stored**). Select another with `CS_CONF=...`.
The lab is its PI (`NAME`, `/scratch/<affiliation>/<pi>/cryosparc`, `ACCOUNT=<pi>_cryosparc`): the PI's own when the caller
has `/scratch/<affiliation>/<self>`, else the one group of the caller with a `/scratch/<affiliation>/<group>` directory
(a manager or member of the PI's group); in several, `CS_LAB=<pi>` names it, and the script refuses until it is named.
The primary group is the shared `users` on the cluster, so it names no lab; a `users.ini` written before this is still
read, unless `CS_LAB` is set. `config` never asks `PHASE` or `CS_SIF`, nor `VERSION` on phase 2: `init`, `update` and
`migrate` set them. `init` creates `DEST`, `DBPATH`, `SSDPATH`, `state/` and the `PROJECT_DIRS` entries under `DEST`; an
entry elsewhere is the lab's data and must exist (`init` and the master's job refuse, `config` warns).
`init` also gives `DEST` to the lab's group (`RUN_GROUP`, the PI's group on the cluster; never the shared primary group
`users`) with setgid: `DEST` and the `PROJECT_DIRS` under it `2750` (the lab reads results), `DBPATH`, `state/` and
`SSDPATH` `2700` (password hashes, license, cache: only the account the master runs as).
As root (image builds) the config is `/apps/software/source/cryosparc/admin.ini` (`CS_ADMIN_CONF`), shared by every
admin and node; set `SRC_DIR` there to a large admin-only directory (tarballs + staged installs, which carry the
admin license until `freeze` strips it).
`DRY_RUN=1 ./cryosparc.sh <cmd>` prints the commands without running them.

### Modes

- `MODE=cluster`: master in a container; each job is an `sbatch` that runs `apptainer exec --nv` (Slurm allocates GPUs).
  Submission from inside the master container: `SLURM_MODE=ssh` (default, `ssh` to `SLURM_SUBMIT_HOST`) or `bind` (host Slurm client bind-mounted through `APPTAINER_BIND`, which a per-host helper sets: `SLURM_APPTAINER_HELPER`, default `/apps/helpers/slurm-apptainer.sh`, template `slurm-apptainer.sh` in the source repo; the binds belong to the host, so they are not kept in the `.ini`).
- `MODE=single`: master and worker on the same host (`devcryo`). CryoSPARC launches jobs as local subprocesses, so they run **inside the master container** (`--nv`).

### One image, two containers

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

- **Master:** a long-running `apptainer instance` inside the lab owner's Slurm job (`cryosparc.sh master-job`), always on `MASTER_HOST`.
- **Worker:** one `apptainer exec --nv` per job, launched by the lane's `sbatch`. In `single` mode (`devcryo`) the worker runs inside the master container.

Why one image:

- Master and worker must be on exactly the same version; a single image makes a 5.0.1 master with a 5.0.0 worker impossible.
- In `single` mode the master launches the worker as a local subprocess, so the worker has to exist inside the master container anyway.
- The extra size is irrelevant: the `.sif` lives on the shared filesystem and is read on demand.

Splitting into master and worker images only pays off if workers run where size or dependencies are constrained (different driver/CUDA, registry limits).

### Where each step runs

| Step | GPU node? | Why |
|---|---|---|
| `build-base`, `freeze` (image build) | No | Image has no driver/CUDA; `--nv` injects the host driver at run time. Needs `apptainer` + subuid/subgid for `--fakeroot`. |
| `install-master`, `stage` (installs master **and** worker), `install-worker` | No | Since v4.4 the worker bundles CUDA; no local toolkit (`--cudapath`) needed. |
| `install-single`, `init`/`migrate` in `MODE=single` | **Yes** | `cryosparcw connect` detects the GPUs of the host it registers. |
| Jobs (`MODE=cluster`) | Allocated by Slurm | The lane `sbatch` requests `--gres=gpu:N`. |

GPU access is always `--nv` (host driver mounted at run time). Never put driver or CUDA toolkit in the image: the driver must match the host kernel module, and the CryoSPARC worker bundles its CUDA runtime. The lane passes Slurm's `CUDA_VISIBLE_DEVICES` explicitly because `--cleanenv` drops it.

### Phase 1 — base image, CryoSPARC in the lab directory

```bash
sudo /apps/helpers/cryosparc.sh build-base 9   # once, as root (OS_RELEASE = node major release): IMAGES_DIR is root-writable,
                                               # and an unprivileged build loses the admin group inside its namespace
./cryosparc.sh config                # DEST, PORT, LICENSE_ID, MODE, PARTITION...
srun -p cryosparc -w <host> -A <account> --pty ./cryosparc.sh install-master   # or install-single on a GPU node
./cryosparc.sh install-worker        # MODE=cluster: install or repair the worker of an existing master
./cryosparc.sh status | open | passwd | update 5.0.2
```

`install-*` and the phase 1 `update` run CryoSPARC's own installer against the database, which only
works on `MASTER_HOST`: they refuse to run anywhere but inside a job there and print the `srun` line
above. They end by submitting the master's job.

The systemd units of earlier versions (`systemd-unit`, e.g. on `devcryo`) are gone: the master runs only
as a Slurm job, so a host outside Slurm can no longer run one with this script. A lab whose old unit is
still installed is refused until the unit is disabled (`systemctl disable --now cryosparc-<name>.service`).

### Phase 2 — one immutable image per version

```bash
sudo /apps/helpers/cryosparc.sh freeze 5.0.7   # root: stage install AT /opt/cryosparc + build /apps/software/cryosparc/cryosparc-5.0.7.sif
./cryosparc.sh versions                # PI: images available, which one this lab runs (--remote asks CryoSPARC for newer releases)
sudo -Hu <pi> /apps/helpers/cryosparc.sh init 5.0.7     # admin or root, as the lab, on a compute node with apptainer, before the lab's first start: new lab (a .sif path also works)
sudo -Hu <pi> /apps/helpers/cryosparc.sh migrate 5.0.7  # admin or root, as the lab, on a compute node with apptainer: existing phase 1 lab
./cryosparc.sh start                   # PI: submits the master's job (= sbatch $DEST/state/master.sbatch, or OnDemand > CryoSPARC Master)
./cryosparc.sh stop                    # PI: clean stop; the job ends (restart = stop, then start)
./cryosparc.sh update 5.0.8            # PI: stops the job, swaps the image, submits the job again; DB migrates on first start
./cryosparc.sh backup [DIR]            # PI: database dump (.archive) while running; default $DEST/backups
./cryosparc.sh restore FILE            # PI: database restore while stopped (in a short job on MASTER_HOST), then start
```

`backup` is the database only (projects are the lab's own directories) and is consistent with the projects as
they were at that moment; CryoSPARC advises against restoring a backup older than the project directories.
The path must be under `DEST` or a project dir (what the master container can see).

Per lab, only state is bind-mounted: `config.sh` (license), `run/`, database, SSD cache and projects.
Anything else CryoSPARC writes into the install tree lands in a per-version overlay (`OVERLAY_MODE=dir`).
`./cryosparc.sh discover` lists those writes; promote the relevant ones to binds, then switch to `OVERLAY_MODE=tmpfs`.

The phase 2 image contains licensed code: **private registry only**.

### Apptainer and enroot from the same image

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

### Labs on this cluster

**Access through OnDemand.** Interactive Apps > CryoSPARC on the OnDemand portal starts a VNC session whose only
window is Firefox (module `Firefox/153.5`) on the master the user picks; the Keycloak login of OnDemand, then the
lab's CryoSPARC login. The web interface cannot go through the node proxy (blank page under `/rnode/`), so the
browser runs inside the cluster. The form's list is
`${BASE_ETC}/ood/config/apps/sj_cryosparc/labs.yml` on the OnDemand host (PI, manager, account, host, port:
see the table below); keep it in step with that table. See
`sj_cryosparc/README.md` in the Skipjack apps repo (`jhu-arch/ood`, branch `SJ`).

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
`sudo -u <pi>`, so the files, the master's job and the license belong to the lab. Run them **on a compute
node with `apptainer` and the Slurm client** (the lab's `MASTER_HOST` is the usual choice; the management
host has no `apptainer`), and **before the lab starts its master**: until `init` has run, `start`, `status`
and `open` only say that nothing is installed. `sudo -Hu` keeps `HOME` the lab's, so the `.ini` read is
the one in the lab account's `~/.cryosparc/`:

```bash
sudo -Hu <pi> /apps/helpers/cryosparc.sh config       # license, DEST, PROJECT_DIRS, PORT, MASTER_HOST, ACCOUNT, RESERVATION
sudo -Hu <pi> /apps/helpers/cryosparc.sh init 5.0.7   # installs, submits the master's job, waits for it,
                                                      # creates the admin and the lane, prints the password once
```

One master per lab, run by the PI (or the lab's manager) with their own license, as a Slurm job of the lab's
account: it stops only when the lab stops it, for `update`, or for a maintenance, and comes back on the same
host and port. Masters are hosted on a node of the `cryosparc` partition (`MASTER_HOST`), never on the
login nodes. `RESERVATION` in the `.ini` sends the lane's
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
39000-39900 plan was dropped: every one of those ports is inside the ephemeral range. The [lab guide](#users)
(`README-user.md`, world-readable) shows this table with placeholder names.

### The master's Slurm job

Only the account the lab is installed under starts and stops its master (the job belongs to it; the
OnDemand app lists the labs in that user's own `~/.cryosparc/`). Lab members only open it.

| | |
|---|---|
| Start | `cryosparc.sh start` (submits `master.sbatch` and waits up to 15 minutes for CryoSPARC; a job still pending then stays queued; `CS_WAIT_SECONDS` changes the wait), OnDemand > **CryoSPARC Master** (`sj_cryosparc_master` in `jhu-arch/ood`, branch `SJ`), or `sbatch $DEST/state/master.sbatch`. All three run that file. `restart` = `stop`, then `start` |
| The file | written from the `.ini` by `init`, `config`, `start` and `lane` (a hand edit is lost): `--job-name=cryosparc-<NAME>`, `--partition=MASTER_PARTITION`, `--nodelist=MASTER_HOST`, `--account=ACCOUNT`, `--qos=MASTER_QOS` and `--reservation=MASTER_RESERVATION` when set, `MASTER_CPUS` cores, `MASTER_MEM`, `--time=MASTER_TIME` only when set, `--requeue`, `--comment=accept_cost` with `ACCEPT_COST=yes`, log `$DEST/state/run/master-<job>.log` (appended across requeues); the body drops the submitting host's Apptainer binds and runs `cryosparc.sh master-job` |
| The job | `master-job` refuses to run outside a job, on another host than `MASTER_HOST` (the database keeps that name), next to another running master job of the lab, or next to a master started by hand; removes leftover supervisor/mongod sockets from `TMP_DIR`; starts the instance and `cryosparcm start` without the job's `SLURM_*` (so the lane's own `sbatch` calls are plain submissions), writes `$DEST/state/master.job`, and holds the foreground while supervisord lives |
| Stop | `cryosparc.sh stop` creates `$DEST/state/master.stop`; the job sees it within 5 s, runs `cryosparcm stop` (which stops the database) and the instance stop, and ends (state COMPLETED). After 5 minutes without that, `stop` falls back to `scancel`. A pending job is just cancelled. OnDemand's **Delete** and `scancel` send TERM to every process of the job; the job traps it and stops the same way, within Slurm's `KillWait`, after which Slurm kills what is left |
| Commands on the master | `status`, `backup`, `passwd` and `lane` reach the master through its supervisor socket, which is on its node: from anywhere else they rerun themselves as a step of the master's job (`SLURM_JOB_ID=<job> srun --jobid=<job> --overlap --nodelist=<node> --export=ALL cryosparc.sh <cmd>`, no new allocation; `cli_filter.lua` skips a step of a running job). `restore` (master stopped) runs in a short job on `MASTER_HOST` (2 cores, `MASTER_MEM`, 4 h) |
| Started by hand | a master started by hand with an older `cryosparc.sh` is detected (the instance on this host, or something answering at `MASTER_HOST:PORT` with no master job): `start`, `init`, `migrate`, `update`, `restore` and the master's job refuse to start a second one on the same database |

**Slurm side (by hand, in the cluster's slurm.conf mirror):**

- Partition `cryosparc`: `Nodes=` the master hosts, `MaxTime=UNLIMITED` and no `DefaultTime` (or
  `UNLIMITED`), `AllowQos=cryosparc`, `AllowGroups=cryosparc` (the same group the `cryosparc`
  reservation admits) or `AllowAccounts=` the `<pi>_cryosparc` accounts and the test lab's, and its
  `TRESBillingWeights` (without that line a core-hour bills 1 SU). Then `scontrol reconfigure` and
  `coldfront import_slurm_cluster --cluster <cluster> --update`.
- QOS `cryosparc` (`MASTER_QOS`, which the master's job asks for): `sacctmgr add qos cryosparc`, and
  register it in ColdFront (Admin > Slurm QOS, the cluster, role blank). Each lab's account must have it
  in its QOS list. ColdFront's sync rewrites account QOS lists, so a `sacctmgr ... qos+=cryosparc` by
  hand comes back off; pin it on the lab's `<pi>_cryosparc` allocation instead: the `QoS` attribute =
  the account's usual QOS plus `cryosparc` (e.g. `jhu,cryosparc`), `DefaultQoS` = the usual one, so
  the lane's CryoSPARC jobs keep their QOS. Check with
  `sacctmgr -nP show assoc account=<pi>_cryosparc format=account,user,qos,defaultqos`.
- In ColdFront, untick **Is available** on that `SlurmPartition`, so Submit Job does not offer it.
- Until that partition exists, set per lab (with `config`, or in the `.ini`): `MASTER_PARTITION` = a
  partition that holds `MASTER_HOST` (`scontrol show node <host>` lists them), `MASTER_RESERVATION` =
  the reservation that holds the host, if any, and `MASTER_QOS` and `MASTER_TIME` blank. A reservation
  does not lift the partition's limits: the master's job ends at that partition's `MaxTime`, and the
  lab owner starts it again (OnDemand or `sbatch`). A `MASTER_TIME` above the partition's limit leaves
  the job pending.
- `JobRequeue` (default 1) lets `--requeue` bring the master back after a node failure, on the same host.
- Not tested yet: with `safe` in `AccountingStorageEnforce`, a job with no time limit on an account
  whose association has a `GrpTRESMins` budget may never start (pending `AssocGrp...Minutes`). If the
  master's job pends that way, set `MASTER_TIME` (e.g. `30-00:00:00`) with `config`; the job then ends
  after that time and must be started again.

**Moving a master started by hand to a job** (one lab at a time, the test lab first):

1. `backup`, with the master running.
2. Stop it with the `cryosparc.sh` it was started with (or the new one, run on its host: its `stop`
   still stops an instance started by hand).
3. Install the new `cryosparc.sh` in `/apps/helpers/`.
4. `config`: adds `MASTER_*` with their defaults (set `MASTER_HOST`, `MASTER_PARTITION`, `MASTER_QOS`,
   `MASTER_RESERVATION` for the lab) and writes `master.sbatch`.
5. `start` (or `sbatch $DEST/state/master.sbatch`), then `status` from a login node.

### Moving a lab from Rockfish

Create the lab on Skipjack first (`init`, with the port from the table above; an admin runs it on a compute
node with `apptainer`, see "Creating a lab"). What the lab does on its
side is in [Moving a lab from Rockfish](#users-moving-a-lab-from-rockfish) under Users. Three things differ between the clusters and
decide the method: the **port** (Rockfish labs used the 39000 range, which is inside the ephemeral range
here, so every lab changes port), the **paths** (`/scratch16/...` there, `/scratch/<affiliation>/<pi>/...`
here) and the **UID/GID** of the same person.

**The database: three ways.**

| | Copy the database directory (CryoSPARC guide, D option 2) | Backup on Rockfish, `restore` here | `export-instance-config` / `import-instance-config` + detach/attach per project |
|---|---|---|---|
| Port and host | ❌ the MongoDB replica set keeps Rockfish's `host:port+1`: a new port needs `cryosparcm fixdbport`, not verified in our container (`changeport` fails there, see Operational notes) | ✅ not in the dump: mongod here starts with the `.ini` host and port | ✅ only users and settings move |
| Keeps | everything | users, projects, jobs, project numbers, settings | users and settings; each project gets a new number (P3 there can be P1 here), job numbers stay |
| Project paths | stay Rockfish's | stay Rockfish's: archive the projects on Rockfish before the backup and unarchive them here with the new path (the guide's same-instance move), **not tested yet** | given at attach |
| Transfer | a large directory of many files, master stopped the whole time | one file | a small tar |
| Tested by us | no | restore of a 5.0.6 dump on 5.0.7: yes; archive/unarchive across it: no | yes, 5.0.6 to 5.0.7 |
| Recommendation | not for Rockfish labs (the port changes) | to rehearse with each lab; use it when the rehearsal attaches every project | the fallback, and the route for any project the rehearsal cannot bring back |

The CryoSPARC team's own advice for a full move (copy the database, no detach/attach) assumes the same
port and the same project paths; neither holds here.

**Projects and raw data: rsync or Globus.**

| | rsync over SSH | Globus |
|---|---|---|
| Symlinks (Import Movies leaves `imported/` full of links to the raw data) | ✅ kept (`-l`) | ❌ skipped in a recursive transfer: `imported/` arrives empty |
| Owner and group (different UID/GID) | ✅ run as the user, without `-o -g`, files belong to the Skipjack account | ✅ always the Skipjack account of whoever transfers |
| Modes and mtimes | `-t` keeps mtimes; leave out `-p` | modes from the destination umask; mtimes only with "preserve source file modification times" |
| Terabytes | one stream, through a login node | parallel streams, through the transfer nodes |
| Interrupted | resumes with `--partial` and a rerun; the session must stay open (tmux) | retries and resumes on its own |
| Verification | size and mtime, unless `--checksum` (slow) | checksum of every file |
| Login | password + code per connection, and the login node limits logins: open ONE control connection (`ssh -fNM -S /tmp/sj-ctl <host>`, then `rsync -e "ssh -S /tmp/sj-ctl" ...`, `ssh -S /tmp/sj-ctl -O exit <host>` when done) | none; needs a Skipjack collection exposing the lab's `/scratch` path (confirm before planning) |

Use: Globus for the database file, the raw data and the bulk of the projects, then one `rsync -rlt`
pass over the projects (mtimes already match, so it brings little more than the links). **Every
transfer runs as the account that runs the master** (the one `init` was run as): files land owned by
whoever transfers, and mongod cannot write a database owned by someone else (`database/` is 2700).
The group comes from the setgid `DEST`, whatever the tool.

**Steps: a rehearsal, then the cut-over.**

| # | Where | Step |
|---|---|---|
| 1 | Rockfish | Rehearsal backup, master still running: `cryosparcm database backup -o <dir>` |
| 2 | Globus | The backup, the raw data and the projects (the big first copy, while the lab keeps working there) |
| 3 | Skipjack | Restore the rehearsal backup (below), `start`, then check users, projects (archived ones unarchive with the new path), the links (below), lanes, one CPU job and one GPU job |
| 4 | Rockfish | **Cut-over:** tell the lab, archive the projects (or detach them, for the attach route), stop the master, final backup |
| 5 | Globus + rsync | The final backup, an incremental sync of the projects, the `rsync -rlt` pass for the links |
| 6 | Skipjack | `stop`, restore the final backup, `start`, unarchive the projects, replace the lanes |
| 7 | Rockfish | The master stays stopped for good (one license ID, two instances); keep the instance and the project directories until the lab confirms the Skipjack copy |

The Rockfish database is never changed (a backup only reads it), so step 7 is also the way back. A backup
taken with the master running is consistent as a database but not necessarily with the project files of
jobs that were running: fine for the rehearsal, which is why the final one comes after the stop.

**Restore here.** `restore` works only into an empty database directory (it runs `mongorestore --drop`).
`cryosparc.sh restore` does not move the old one yet, so as the lab's account:

```bash
/apps/helpers/cryosparc.sh stop
mv "$DBPATH" "$DBPATH.before-$(date +%Y%m%d)" && mkdir -m 2700 "$DBPATH"   # DBPATH, DEST: from `show`; never delete the old one
/apps/helpers/cryosparc.sh restore "$DEST/backups/<file>"   # the file must sit under DEST or a PROJECT_DIRS entry
/apps/helpers/cryosparc.sh start
```

- The Rockfish users replace the admin `init` created; their Rockfish passwords work. Keep the `init`
  password until you have logged in with a Rockfish account. Check `cryosparcm user list`.
- The dump carries Rockfish's lanes and workers (the master log shows `Could not get GPU info from
  <rockfish host>` at start): remove them (`cryosparcm cluster remove <lane>`, `cryosparcm worker
  disconnect --worker <host>`), then `lane`.
- The master rewrites `running_version` and `running_patch` on start, so the version difference
  (5.0.6 or 5.0.1 there, 5.0.7 here) is repaired by the first start. The CryoSPARC team says a 5.0.1
  database works on 5.0.7; we tested 5.0.6.
- `cryosparcm` commands run inside the master's job, on its node:
  `srun --jobid=<job> --overlap --pty apptainer exec instance://cryosparc-<NAME> /opt/cryosparc/cryosparc_master/bin/cryosparcm <args>`
  (`status` shows the job; `<NAME>` is the lab's `NAME`).

**The attach route** (per project; also the fallback): users and settings with
`cryosparcm database export-instance-config` on Rockfish (writes `cryosparc_instance_config_<date>.tar`)
and `cryosparcm database import-instance-config -f <tar>` here. It replaces the users and settings
collections, including the `init` admin, with no version check, and brings Rockfish's lanes the same way
(remove them as above). Then per project the lab detaches on Rockfish, copies, re-points the links and
attaches here. Attach assigns a new project number, keeps job numbers, rewrites `project.json` and
`cs.lock`, and refuses a project that still has a `cs.lock`. A `cryosparcm recover --file` is not an
alternative: it requires `running_version` to match exactly (a 5.0.6 tar does not load on 5.0.7) and its
"attached N/N" count is misleading.

**Links to the raw data.** When the raw data's path changes, Import Movies links point at the old
path (`find <project> -xtype l` lists the broken ones). On 5.0.x, in `cryosparcm icli`, per project:

```python
my_project_uid = "P1"                  # the project's number on Skipjack
my_prefix_cut = "/scratch16/old/raw/"  # the old prefix
my_prefix_new = "/scratch/jhu/pi/raw/" # the new prefix
after = None
while jobs := api.jobs.find(project_uid=my_project_uid, after=after):
    for job in jobs:
        try:
            n = api.jobs.update_directory_symlinks(job.project_uid, job.uid,
                    prefix_cut=my_prefix_cut, prefix_new=my_prefix_new)
            print(f"{job.full_uid}: {n} links")
        except Exception as e:
            print(f"{job.full_uid} failed: {e}")
    after = jobs[-1].id
```

Every directory the lab uses (projects and raw data) must be in `PROJECT_DIRS` before the master starts:
the binds are fixed at start, a change needs `restart`.

**Open points.**

- Licenses: one license ID ran on Rockfish and on two Skipjack test masters at the same time. Whether the
  license terms allow two instances with the same ID (what happens while a lab runs on both clusters)
  must be settled before the lab migrations start. Never paste a full license ID in a ticket or here.
- Not tested: 4.x to 5.x (labs still on 4.5.3), `upgrade --validate-only`, labs with several projects or
  users, large projects, archive/unarchive across a restore.
- `restore` should move the old database aside itself; until it does, the `mv` above.

**References.**

- [CryoSPARC guide: migrating your instance](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/tutorial-migrating-your-cryosparc-instance)
  (moving raw data, project directories, the database, the master to another machine; the symlink loop above),
  in particular [option 2, installation not shared](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/tutorial-migrating-your-cryosparc-instance#option-2-installation-is-not-shared)
  and [modifying project and job symlinks](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/tutorial-migrating-your-cryosparc-instance#modify-project-job-symlinks).
- [CryoSPARC guide: data management (v4.0+)](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/guide-data-management-in-cryosparc-v4.0)
  (detach/attach between instances, archive/unarchive to move a project within one, `cs.lock`).
- [CryoSPARC forum: moving the whole database and data to a new cluster](https://discuss.cryosparc.com/t/moving-the-whole-database-and-data-to-a-new-cluster/25534/6)
  (a 5.0.1 database on 5.0.7; no detach/attach when paths and port stay the same).

### Operational notes

- **Run-as account:** the master runs as whoever submits its job, the lab owner. `RUN_USER`/`RUN_GROUP` only name `TMP_DIR` now (the systemd units they were for are gone).
- **Groups/SSSD:** no SSSD inside the container. Supplementary groups are kernel credentials set by slurmd (via host SSSD) and inherited; Apptainer writes your user and groups into the container `/etc/passwd`/`/etc/group`. Groups are fixed at start: stop and start the master after group changes. Check inside the container: `id; grep Groups /proc/self/status`.
- **Unique `PORT` per lab, fixed once the lab exists:** the master's job aborts if anything listens in `PORT..PORT+10`. `PORT` in the `.ini` is written into the master `config.sh` (`CRYOSPARC_BASE_PORT`) only while the lab has no database yet; after the first start the database keeps the port too (MongoDB replica set member `<host>:<port+1>`), so the master's job refuses a different `PORT` instead of leaving mongod without a primary. `init` refuses a `DBPATH` that already holds a database and stops a leftover instance first; redo a failed `init` by moving `DEST` aside.
- **Private `/tmp` per lab** (`TMP_DIR`, default `/tmp/cryosparc-<NAME>-<user>`): in phase 2 all labs share the install path `/opt/cryosparc`, so a shared `/tmp` could mix their sockets/locks.
- **Patch master and worker together.** The worker must match the master's version AND patch (`v5.0.7` vs `v5.0.7+260921` fails every job at start). `cryosparcm patch` does not reach a cluster worker: `cryosparcm patch --download` (add `--force` when the master already has the latest patch) writes `cryosparc_master_patch.tar.gz` and `cryosparc_worker_patch.tar.gz` into `cryosparc_master/`; `cryosparcm patch --install` + `cryosparcm restart` patch the master; copy the worker file into `cryosparc_worker/` and run `bin/cryosparcw patch` there, inside the base image. The `version` file does not show the patch.
- **Stop with `cryosparc.sh stop`.** A `cryosparcm stop` typed inside the job also ends it, a minute later and as a failure (the job holds the foreground while supervisord lives, and logs that it ended on its own). `cryosparcm restart` does not end it: supervisord is back well within that minute.
- **Phase 2 `config.sh` is a bind-mounted file:** commands that rewrite it by rename (e.g. `cryosparcm changeport`) fail inside the container; edit `state/master.config.sh` on the host instead.
- **`SSDPATH` in `MODE=cluster`** should be node-local scratch on the GPU nodes, not WEKA (or GPFS on Rockfish).

### Fixes to the 2023 script

- `$dDESTINATIO` typo (tunnel file written to `/`).
- `SSDPAT=` typo (`SSDPATH` never updated).
- `[ -f "~/.CryoSparc.ini" ]` never expanded `~`.
- Password stored in plain text and printed: now shown once at install, never stored; `passwd` reads it silently.
- `rm -rf $DEST/...` without guard: `safe_rm` refuses paths outside `DEST`.
- Update fetched `worker-latest`: now the exact version for master and worker.
- `createuser` ran before the database was up.
- `VERSION=4.4.0` hard-coded in 4 places; `*gpu*` hostname check replaced by `nvidia-smi`.

### Validate before production

- Versioned download URL `get.cryosparc.com/download/{master,worker}-vX.Y.Z/<license>` (pre-placed tarballs in `SRC_DIR/vX.Y.Z/` skip the download).
- v5 `install.sh` flags (`--hostname`, `--dbpath`, `--port`, `--standalone`) on a test install.
- Unprivileged directory overlay requires Apptainer ≥ 1.1 with `fuse-overlayfs`; otherwise use `OVERLAY_MODE=tmpfs`.
- `--fakeroot` build needs subuid/subgid for the building user.

</div>

<div markdown="block">

## User lab guide

!!! info "Public version"
    What PIs and lab members read is the public [CryoSPARC tutorial](https://docs.arch.jhu.edu/en/latest/3_Tutorials/specialized/Tutorial_CryoSPARC.html);
    a copy is installed as `/apps/software/cryosparc/README-user.md`. This section is the same guide for staff:
    this site is staff-only, so send lab members the public link.

Each lab runs its own CryoSPARC: your account, your database, your license, your project
directories. What is shared is the software: one image per CryoSPARC version in
`/apps/software/cryosparc/`. Everything below is done with one command, `/apps/helpers/cryosparc.sh`.

### Before you start

**ARCH creates your lab's master: you ask for it.** Nothing below works until ARCH has installed it
(see [One-time setup](#one-time-setup-done-by-arch)). To ask:

1. Request the Slurm account first: in ColdFront, a paid allocation of your PI's project with
   abbreviation `cryosparc` (it becomes `<pi>_cryosparc`). The master's job and your CryoSPARC jobs run
   under it, so ARCH waits for its approval.
2. Open a ticket on the [ARCH helpdesk](https://helpdesk.arch.jhu.edu/tickets/submit/), or e-mail
   `Arch@jh.edu` with the same content (Schmidt Sciences labs:
   [their helpdesk](https://helpdesk.schmidtsciences.jhu.edu/tickets/submit/) or `SSCI@jh.edu`). On the
   form, choose **"I need software installed, or a module is missing or broken"** under "What best
   describes your issue?" and fill in:

    | Field | What to write |
    |---|---|
    | What do you need? | A CryoSPARC master for my lab |
    | Software name and version | CryoSPARC and the version (`/apps/helpers/cryosparc.sh versions` lists the images), or "latest" |
    | Website or download link | <https://cryosparc.com> |
    | License | academic license from Structura, held by your PI. **Never the license ID itself** (step 3) |
    | What will you use it for? | your project, in a sentence |
    | Who will use it? | the PI, the account that will start and stop the master (the PI or the lab manager), and the members (JHED IDs) |
    | Special requirements | the GPU partition you need (e.g. `a100`), where your projects and raw data live (they become `PROJECT_DIRS`), and whether you are moving a lab from Rockfish (see [Moving a lab from Rockfish](#users-moving-a-lab-from-rockfish)) |

3. Give ARCH the license ID through the settings file, not the ticket: as the account that will run the
   master, run `/apps/helpers/cryosparc.sh config` and type it at `LICENSE_ID` (the file is mode 600).
   Say in the ticket that you did.
4. ARCH answers with your port and host, installs the master and sends you the admin password once.

You need:

- A CryoSPARC **license ID** for your lab (free for academic use, requested from Structura).
- Your PI's directory on `/scratch` for the install, the database and the SSD cache:
  `/scratch/<affiliation>/<pi>/cryosparc` by default. The lab is the PI's: a manager or member sets it
  up from their own account, as a member of the PI's group. If you are in several PIs' groups, name
  the lab each time: `CS_LAB=<pi> /apps/helpers/cryosparc.sh ...`.
- Your lab's **Slurm account for CryoSPARC**, `<pi>_cryosparc`: a paid allocation of your project,
  requested in ColdFront like any other (project abbreviation `cryosparc`). Jobs are charged to it.
- Your **port**, assigned by ARCH: CryoSPARC uses `PORT` to `PORT+10`, one range per lab, below the
  kernel's ephemeral range (32768-60999, which CryoSPARC refuses). Ask ARCH if you do not have yours.
- The host ARCH gives your lab for the master, a node of the `cryosparc` partition. The master always
  runs there, as a Slurm job of yours (see [Every day](#every-day)), never on a login node.

What ARCH assigns per lab looks like this. Apart from the first row (ARCH's own test lab), the names and
accounts are **examples only**, scientists from history: they are not labs, users or Slurm accounts of
this cluster. The ports show the scheme (one hundred apart), not who has which. Your own values come from
ARCH (`show` prints them).

| PI | Manager | Slurm account (`ACCOUNT`) | `PORT` |
|---|---|---|---|
| Skipjack lab (ARCH) | R.S. Jacomini | `sjadmin` | 25000 |
| Ada Lovelace | Charles Babbage | `alovela1_cryosparc` | 25100 |
| Grace Hopper | Howard Aiken | `ghopper1_cryosparc` | 25200 |
| Rosalind Franklin | Raymond Gosling | `rfrankl1_cryosparc` | 25300 |
| Dorothy Hodgkin | Max Perutz | `dhodgki1_cryosparc` | 25400 |
| Barbara McClintock | Harriet Creighton | `bmcclin1_cryosparc` | 25500 |
| Chien-Shiung Wu | Luke Yuan | `cwu1_cryosparc` | 25600 |
| Lise Meitner | Otto Frisch | `lmeitne1_cryosparc` | 25700 |
| Emmy Noether | Hermann Weyl | `enoethe1_cryosparc` | 25800 |
| Katherine Johnson | Dorothy Vaughan | `kjohnso1_cryosparc` | 25900 |
| Mary Anning | Henry De la Beche | `mannin1_cryosparc` | 26000 |

### One-time setup (done by ARCH)

ARCH creates your lab's master under your account: it fills your settings (`~/.cryosparc/<pi>.ini`),
installs the version you agreed on and starts it as a Slurm job of yours on the assigned host. You receive the admin
password once; change it with `passwd`. What ARCH needs from you: the license ID, the project
directories, and the CryoSPARC version (`/apps/helpers/cryosparc.sh versions` lists them).
You can fill the settings yourself beforehand with `config`. ARCH runs `init` (on a compute node, as your
account) before your first start; until then `start`, `status` and `open` only say that no CryoSPARC is
installed for your lab yet.

Settings in that file (`/apps/helpers/cryosparc.sh show` prints yours):

| Setting | Value |
|---|---|
| `MODE` | `cluster` (jobs run through Slurm) |
| `DEST`, `DBPATH`, `SSDPATH` | under your PI's `/scratch` directory |
| `PROJECT_DIRS` | comma-separated directories your projects and data live in, mounted as they are: CryoSPARC sees nothing else of `/scratch`. `init` creates the default `projects/` under `DEST`; any other directory is yours and must exist (`config` warns, the master's job does not start without it) |
| `RUN_GROUP` | your PI's group: `init` gives the lab's directory to it, results readable by the lab, the database and state only by the account the master runs as |
| `PORT` | the one ARCH assigned to your lab (below 32768) |
| `MASTER_HOST` | the host the master runs on (its database keeps that name) |
| `MASTER_PARTITION`, `MASTER_QOS`, `MASTER_RESERVATION` | the master's own job: partition and QOS `cryosparc`; reservation `cryosparc` when ARCH holds your host with one, else blank |
| `MASTER_CPUS`, `MASTER_MEM`, `MASTER_TIME` | the master job's size (`4`, `24G`) and time limit (blank: none, it runs until you stop it) |
| `LICENSE_ID` | your lab's license |
| `ACCOUNT`, `PARTITION`, `RESERVATION` | `<pi>_cryosparc`; GPU partition (e.g. `a100`); blank, unless ARCH gives your lab a reservation for its jobs (a job in a reservation runs only on its nodes, so it must hold nodes of `PARTITION`) |
| `CPU_PARTITION` | `med`: where CPU-only jobs (Import Movies, ...) run; GPU partitions refuse a job that asks for no GPU. Blank: everything on `PARTITION` |
| `ACCEPT_COST` | `yes` when `ACCOUNT` is a paid allocation: the lane's jobs carry `--comment=accept_cost`, because a submit from CryoSPARC cannot answer the cluster's `[y/N]` cost prompt |
| `SLURM_MODE` | `bind` |
| `EMAIL`, `ADMIN_USER` | the CryoSPARC admin login |

The `.ini` holds your license ID: it is mode 600, keep it that way and do not paste it in tickets.
`config` asks every setting except `PHASE`, `CS_SIF` and (once installed) `VERSION`: those record what
is installed and only `init`, `update` and `migrate` set them.

### Every day

The master runs as a Slurm job of yours, on your lab's host, charged to `ACCOUNT`, until you stop it.
Only the account the lab is installed under starts and stops it; lab members only open it. Start it
any of these ways; all three submit the same job:

- **`cryosparc.sh start`** on a login node: submits the job and waits up to 15 minutes for CryoSPARC
  to answer. A job still waiting in the queue after that stays queued (`status` shows when it is up).
- **OnDemand:** **Interactive Apps > CryoSPARC Master**, pick your lab, **Launch**. The session card
  shows the address and how to open it.
- **`sbatch $DEST/state/master.sbatch`** on a login node.

```bash
/apps/helpers/cryosparc.sh start          # submits the master's job, waits for CryoSPARC
/apps/helpers/cryosparc.sh status         # the master's job and CryoSPARC's own status
/apps/helpers/cryosparc.sh stop           # clean stop: CryoSPARC stops its database, then the job ends
/apps/helpers/cryosparc.sh restart        # stop, then start
/apps/helpers/cryosparc.sh open           # how to reach the web interface from your workstation
/apps/helpers/cryosparc.sh passwd         # change the admin password
```

**Delete** on the OnDemand card stops it too
(Slurm signals the job and the master stops within Slurm's grace period); `stop` is the cleaner way.
Run these commands on a login node: `status`, `backup`, `passwd` and `lane` run themselves inside the
master's job, on its node. The job's log is `$DEST/state/run/master-<job>.log` (started from OnDemand:
the session's `output.log`).

#### The master's job file

`$DEST/state/master.sbatch` is the Slurm job that runs your master: `sbatch` takes it, and the
CryoSPARC Master app in OnDemand runs the same file with the same options. `cryosparc.sh` writes it
from your settings (`init`, `config`, `start`, `lane`, and any command that tells you to `sbatch` it
while it does not exist yet), so a change goes through `config`: an edit by hand is lost.

| In the file | From the setting |
|---|---|
| `--job-name=cryosparc-<NAME>` | `NAME`; `status` and `stop` find the job by this name |
| `--partition`, `--nodelist` | `MASTER_PARTITION`, `MASTER_HOST` |
| `--account`, `--qos`, `--reservation` | `ACCOUNT`; `MASTER_QOS` and `MASTER_RESERVATION`, when set |
| `--cpus-per-task`, `--mem`, `--time` | `MASTER_CPUS`, `MASTER_MEM`; `MASTER_TIME`, when set (otherwise no time limit) |
| `--requeue` | always: after a node failure the job comes back on the same host |
| `--comment=accept_cost` | `ACCEPT_COST=yes` |
| `--output` | `$DEST/state/run/master-<job>.log` |

Its last line runs `cryosparc.sh master-job`, which starts CryoSPARC and holds the job until you stop it.

The web interface listens on `http://<host>:PORT`, inside the cluster only. Two ways in, both printed by
`open` with your host and port filled in:

1. **SSH tunnel**, from your workstation: `ssh -N -L PORT:<host>:PORT <user>@<login host>`, keep it
   running, then open `http://localhost:PORT` in your browser, with the login host `open` prints. If ssh
   answers `channel open failed: administratively prohibited`, the login node refused the forward: use
   OnDemand, and tell ARCH the login host and port you used.
2. **OnDemand** (no ssh needed): **Interactive Apps > CryoSPARC**, pick your lab, **Launch**, then
   **Launch CryoSPARC** on the session card. Firefox opens on your lab's master (your usual OnDemand
   login, then your CryoSPARC login); closing Firefox ends the session.

Other lab members are added as CryoSPARC users inside the web interface, or from the command line below.

### Lab members' accounts

Inside the master's job, as the account that runs the master: from a login node, open a shell in that
job (on the master's node), then:

```bash
J=$(squeue --me -h -n cryosparc-<name> -o %i)          # the master's job
SLURM_JOB_ID=$J srun --jobid=$J --overlap --pty bash   # a shell inside it
apptainer instance list                      # the master's instance: cryosparc-<name>
I=instance://cryosparc-<name>
C=/opt/cryosparc/cryosparc_master/bin/cryosparcm
apptainer exec $I $C user create --email <email> --password '<password>' --username <user> \
    --firstname <first> --lastname <last>    # add --role admin for another CryoSPARC admin
apptainer exec $I $C user resetpassword --email <email> --password '<new password>'
apptainer exec $I $C user list               # accounts, with an Admin column
apptainer exec $I $C user --help             # every user command
```

These are the CryoSPARC 5 commands; on 4.x they are `cryosparcm createuser` and `cryosparcm resetpassword`
with the same options (no `--role`). CryoSPARC never e-mails a reset link or token: **Reset password > I need
a reset token** on the login page creates a token that only the lab's CryoSPARC admin can see and pass on,
so `user resetpassword` is the quicker way.

### Jobs

Jobs are submitted to Slurm by the lane `init` created (`$DEST/lanes/<partition>/`), charged to
`ACCOUNT`, as your user: jobs that ask for GPUs on `PARTITION`, CPU-only jobs on `CPU_PARTITION`
(and both in `RESERVATION` when set). In the job builder choose the lane named `slurm-<partition>`.

`lane` writes both lane files from your settings, so a change goes through `config` and then `lane`;
an edit made by hand in `$DEST/lanes/` is lost the next time `lane` runs. If a job fails at submit with
a `[BILLING] ... Proceed? [y/N]` / `Cancelled` message, the cluster is asking for a cost confirmation
that a non-interactive submit cannot give: set `ACCEPT_COST=yes` with `config`, then run `lane`.
The lane in `/apps/software/cryosparc/examples/lane-a100/` is a reference for what `lane` writes.

### Versions

```bash
/apps/helpers/cryosparc.sh versions          # images available, the one your lab runs
/apps/helpers/cryosparc.sh versions --remote # also what CryoSPARC has released
/apps/helpers/cryosparc.sh update 5.0.8      # move your lab to that version (stops the job, swaps, starts a new one)
```

Forward only: the first start on a newer version migrates your database, and an older version
will not start on a migrated database. Take a `backup` before an `update`.
`update` stops the master's job and submits a new one, on the same host and port; nothing else about
your lab changes across versions.

### Backup and restore

```bash
/apps/helpers/cryosparc.sh backup            # database dump (.archive) into $DEST/backups, master running
/apps/helpers/cryosparc.sh backup /scratch/.../somewhere   # any directory under DEST or a project dir
/apps/helpers/cryosparc.sh stop
/apps/helpers/cryosparc.sh restore /scratch/.../cryosparc_backup_....archive   # a short job on your lab's host
/apps/helpers/cryosparc.sh start            # or OnDemand > CryoSPARC Master
```

The backup is the database only. Your project directories are your data and are not copied; a
backup matches them as they were when it was taken, so do not restore one older than your projects.

### Moving a lab from Rockfish {#users-moving-a-lab-from-rockfish}

ARCH creates your lab here first (see [One-time setup](#one-time-setup-done-by-arch)) and plans the move
with you. Your Rockfish database and project directories are only read, never changed, so Rockfish stays
your way back until you confirm the copy here. Nothing below needs sudo.

#### What moves, and how

| What | How | Who |
|---|---|---|
| CryoSPARC accounts, settings, and (when the rehearsal shows it works) your projects as they are | a database backup on Rockfish, restored here; your Rockfish login and password keep working | ARCH, with you |
| Project directories | Globus, then one `rsync` pass for the links (below) | you |
| Raw data (movies, gain references) | Globus, to a directory under your `PROJECT_DIRS` | you |

Run every transfer as the account your lab's master runs under (the one ARCH installed it with): the
files arrive owned by whoever transfers them, so your Rockfish user and group numbers do not matter, but
the master cannot use files owned by someone else.

#### rsync or Globus

| | rsync | Globus |
|---|---|---|
| Links left by Import Movies | ✅ kept | ❌ skipped: the `imported/` folders arrive empty |
| Speed on terabytes | one stream, through a login node | many streams, through the transfer nodes |
| Interrupted | rerun it (`--partial`); keep the session open (tmux) | resumes on its own |
| Checked | size and date | checksum of every file |

So: Globus for the raw data and the bulk of the projects (tick "preserve source file modification times"),
then, for each project, one pass that brings the links:

```bash
rsync -rlt --partial --info=progress2 <rockfish-host>:<rf-path>/<project>/ <sj-path>/<project>/
```

`-rlt` keeps links and dates and leaves owner, group and modes to this cluster. The login nodes limit
how many sessions you can open: reuse one connection (`ssh -fNM -S /tmp/sj-ctl <host>`, then
`rsync -e "ssh -S /tmp/sj-ctl" ...`, and `ssh -S /tmp/sj-ctl -O exit <host>` when done).

#### The steps

1. **Decide where things go here.** The project folders and the raw data must sit under a directory listed
   in `PROJECT_DIRS` (`/apps/helpers/cryosparc.sh show`). To add one, run `config`, then `restart`: the
   container's mounts are fixed when the master starts.
2. **First copy, while you keep working on Rockfish:** raw data and projects with Globus; ARCH restores a
   rehearsal backup of your database here.
3. **Check the rehearsal** with ARCH: log in with your Rockfish account, open a finished job and its inputs,
   run a small CPU job and one GPU job.
4. **Cut-over day:** on Rockfish, archive (or, if ARCH says so, detach) your projects and stop working
   there; ARCH takes the final backup.
5. **Last sync:** Globus again (only what changed) and the `rsync` pass above.
6. ARCH restores the final backup here; you unarchive (or attach) each project with its new path and
   check one job again.
7. **Stop using Rockfish** for CryoSPARC; keep the Rockfish copy until you are happy with this one.

Do not run the same lab on both clusters for long: the two instances would write different copies of
the same projects, and they use the same license.

#### What to expect

- **Attached projects get a new number** (P3 on Rockfish can become P1 here); job numbers (J1, J2, ...)
  stay. Update notes or scripts that mention project numbers. Unarchived projects keep their number.
- **Deleted jobs stay hidden**, and jobs that were running when you stopped come back as not finished.
- Results and logs are kept, but a job whose inputs pointed at a Rockfish path cannot run again until those
  inputs resolve here. When the raw data's path changed, the links must be rewritten: `find <project>
  -xtype l` lists the broken ones; ARCH has the command that rewrites them for a whole project.

#### If attach or unarchive fails

| Message or symptom | Cause, fix |
|---|---|
| Attach refused, lock found | the project is still attached on Rockfish: detach it there first |
| Path rejected | you gave the parent directory: give the project folder itself (the one with `project.json`) |
| The file picker shows nothing, or "400" in `$DEST/state/run/api.log` | leading spaces in the path box: clear it and retype the path |
| Path not found | the directory is not under `PROJECT_DIRS`: add it with `config`, then `restart` |

References: CryoSPARC's guides on
[migrating an instance](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/tutorial-migrating-your-cryosparc-instance)
and [data management](https://guide.cryosparc.com/setup-configuration-and-management/software-system-guides/guide-data-management-in-cryosparc-v4.0)
(detach, attach, archive), and the CryoSPARC forum thread
[moving the whole database and data to a new cluster](https://discuss.cryosparc.com/t/moving-the-whole-database-and-data-to-a-new-cluster/25534/6).

### When something fails

| Symptom | Cause, fix |
|---|---|
| `Account 'X' is not available for user ...` at submit | `ACCOUNT` is not a Slurm account you belong to: fix it with `config`, then `lane` |
| `the master of <name> is not running` | start it: `cryosparc.sh start`, OnDemand > CryoSPARC Master, or `sbatch $DEST/state/master.sbatch` |
| `Invalid qos specification` or `Invalid account or account/partition combination` when the master starts | your account cannot use the `cryosparc` QOS or partition yet: open a ticket |
| The master's job stays pending | `squeue --me` shows the reason; its host is busy or down: open a ticket |
| `ports in use within N-N+10` in the master job's log | another lab uses that range: change `PORT` in `config` |
| `SLURM_MODE=bind needs the host Slurm client ...` | the host has no `/apps/helpers/slurm-apptainer.sh`: tell ARCH |
| OnDemand session shows "nothing answers" or a connection error | the master is stopped: `status`, then start it (above); reload the page in Firefox |
| Your lab is not in the OnDemand list | ARCH adds it: open a ticket |
| SSH tunnel: `channel open failed: administratively prohibited` | the login node refused the forward: use OnDemand, and tell ARCH the login host and port you used |
| Logs | `status`; the master job's log `$DEST/state/run/master-<job>.log`; CryoSPARC's service logs under `$DEST/state/run/` |

Anything else: `/apps/helpers/cryosparc.sh help`, or open a ticket with ARCH.

</div>

</div>

<script src="../cryosparc-tabs.js"></script>

---

<small>Version 2026-11-05: copied from `/apps/software/source/cryosparc/cryosparc-apptainer/README.md` (Admin) and `/apps/software/cryosparc/README-user.md` (Users). Those copies win when they differ.</small>
