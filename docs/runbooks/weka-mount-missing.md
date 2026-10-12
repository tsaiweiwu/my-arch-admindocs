# Runbook: WEKA mount missing

**Symptom:** `weka-mount-check` alert on a login node, NHC drain, or users report `/home` or `/scratch` missing.

```bash
ssh <n> 'df -h -t wekafs; weka local ps; systemctl status weka-agent --no-pager | head'
ssh <n> 'mount | grep wekafs | wc -l'
pdsh -w <list> 'df | grep -E "wekafs1/scratch|wekafs1/home" | wc -l' | dshbak -c
```

!!! todo "Stub"
    - [ ] Expected mount count per role
    - [ ] Remount procedure (anchorfs first), and when a node reboot is needed instead
    - [ ] Client container restart (`weka local restart`) side effects on running jobs
    - [ ] Escalation to WEKA support
