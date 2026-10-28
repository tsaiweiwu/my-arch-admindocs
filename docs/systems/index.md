# Systems

How the Systems team runs the machines: head nodes, networks, provisioning, Slurm administration, storage
backends, identity services, monitoring, operations and security. Shared cluster facts are in
[Cluster](../cluster/index.md).

| Section | What's there |
|---|---|
| [Infrastructure](infrastructure/access.md) | Access, mgmt01/mgmt02, networks, login/DTN nodes, BMCs, InfiniBand |
| [Compute](compute/provisioning.md) | Provisioning (mProv), adding and retiring nodes |
| [Slurm admin](slurm/configuration.md) | Configuration, prolog/epilog, NHC, common tasks, restarts, upgrades, troubleshooting |
| [Storage](storage/weka.md) | WEKA, NFS and autofs |
| [Identity](identity/ldap-sssd.md) | LDAP/SSSD, Keycloak |
| [Services](services/cloack-stack.md) | CLOACK stack, reverse proxy, mail, Globus |
| [Monitoring](monitoring/overview.md) | Prometheus/Thanos, Grafana, exporters, logging, alerting |
| [Operations](operations/daily-checks.md) | Daily checks, scheduled jobs, backups, maintenance, change management, incidents, patching |
| [Security](security/posture.md) | Posture and findings, secrets handling |
| [Runbooks](runbooks/index.md) | Node down, slurmctld, WEKA mounts, GPU errors, database restore |
