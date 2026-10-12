# Monitoring overview

| Component | Where | Notes |
|---|---|---|
| Prometheus | mgmt01 (container `prometheus`) | Scrapes the exporters ("skipjack shard") |
| Grafana | mgmt01 (container `grafana`) | Dashboards (jobstats dashboards in `/opt/mprov/software/jobstats/grafana`) |
| Loki | "graf" host 172.20.3.100:3100 | Central logs. promtail on mgmt02 pushes there |
| node_exporter | every node, :9100 | Plus textfile collectors |
| ipmi_exporter | physical nodes + mgmt02, :9290 | BMC sensors + SEL |
| cgroup_exporter | compute/GPU + mgmt02, :9306 | Per-job CPU/mem for jobstats |
| nvidia GPU exporter | GPU nodes, :9445 | jobstats GPU metrics |
| infiniband_exporter | one host per fabric, :9315 | Fabric-wide port stats |
| prometheus-slurm-exporter | mgmt02, :9101 | vpenso exporter: nodes, partitions, queue, sdiag |
| blackbox-exporter | mgmt02 container, :9115 | HTTP 2xx / TCP probes |
| logporter | mgmt02 container, :9333 | Docker container metrics |

The exporter installs are versioned in `/opt/mprov/software/exporter_installs/`
(README there is authoritative). See [Exporters & collectors](exporters.md).

!!! todo "Stub"
    - [ ] Grafana URL, auth, and the key dashboards (cluster, Slurm, GPU, WEKA, jobstats)
    - [ ] Prometheus retention, storage size, scrape config location
    - [ ] WEKA metrics: exported to Prometheus? (WEKA has its own Grafana/exporter)
    - [ ] Is the stopped `node-exporter` container on mgmt02 (exited 2 months ago) superseded by the host `node_exporter`? If so, remove it from the compose file
