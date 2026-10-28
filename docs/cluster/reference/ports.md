# Ports & services (mgmt02)

*From `ss -tlnp` on 2026-10-12. "All" = bound on 0.0.0.0/[::].*

| Port | Bind | Service |
|---|---|---|
| 22 | all | sshd |
| 25 | all | npm (stream) |
| 80 / 443 | all | npm (HTTP/HTTPS edge) |
| 81 | 127.0.0.1 | npm admin UI |
| 111 | all | rpcbind |
| 389 / 636 | all | openldap |
| 2211 | all | npm (stream) |
| 2525 | 127.0.0.1 | arch-mta (Postfix) |
| 5432 | 127.0.0.1 | postgres |
| 6010 | 127.0.0.1 | sshd X11 forwarding |
| 6817 | all | skipjack-slurmctld |
| 6819 | all | skipjack-slurmdbd |
| 6820 | all | skipjack-slurmrestd |
| 8081 | all | phpLDAPadmin |
| 8085 | 127.0.0.1 | ood |
| 9100 | all | node_exporter |
| 9101 | all | prometheus-slurm-exporter |
| 9115 | all | blackbox-exporter |
| 9290 | all | ipmi_exporter |
| 9306 | all | cgroup_exporter |
| 9333 | all | logporter |
| 14000–14003, 14050 | all / 127.0.0.1 | WEKA agent (nginx + client) |
| 14100 | 127.0.0.1 | weka |
| 18000 | 127.0.0.1 | coldfront |
| 18001 | 127.0.0.1 | helpdesk |
| 40443 | 127.0.0.1 | keycloak |

Node-side ports: slurmd 6818, srun 60001–63000, node_exporter 9100, ipmi_exporter 9290,
cgroup_exporter 9306, GPU exporter 9445, IB fabric exporter 9315.
