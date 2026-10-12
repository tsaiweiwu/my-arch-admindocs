# Skipjack Admin Docs

Documentation for the people who run **Skipjack**, the ARCH (Advanced Research
Computing at Hopkins) HPC cluster serving Johns Hopkins (JHU) and Schmidt
Sciences (SSCI) research groups.

!!! info "How current is this?"
    The factual pages were first written from a read-only survey of `mgmt02`
    on **2026-10-12**. Node states, counts and versions drift, so check the live
    system before acting on anything here. Every page that still needs content
    has a **Stub** box listing what belongs there.

## Start here

| If you need to… | Go to |
|---|---|
| Get a picture of the whole cluster | [Cluster at a glance](overview/cluster-at-a-glance.md) |
| Understand how the pieces fit | [Architecture](overview/architecture.md) |
| Reach the head nodes | [Accessing the cluster](infrastructure/access.md) |
| Drain, resume or reboot nodes | [Common Slurm admin tasks](slurm/common-tasks.md) |
| Fix a down node | [Runbook: node down](runbooks/node-down.md) |
| Find where a config file lives | [File locations](reference/file-locations.md) |
| Look up a port | [Ports & services](reference/ports.md) |

## The one thing to know about mgmt02

Slurm's controller, database daemon and REST API **do not run as host systemd
services on mgmt02**. They run as **Docker containers** (`skipjack-slurmctld`,
`skipjack-slurmdbd`, `skipjack-slurmrestd`, `slurm-db`) next to the CLOACK
portal stack (ColdFront, Keycloak, OpenLDAP, Postgres, Helpdesk, Open OnDemand).
`systemctl status slurmctld` shows nothing useful. Use `docker ps`, `docker logs`
and the [restart procedure](slurm/restart.md).
