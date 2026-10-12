# Command cheat sheet

```bash
# --- Slurm ---
dn                                         # drained/down nodes
sinfo -s ; sinfo -R ; squeue -t PD | wc -l
scontrol update node=<n> state=drain reason="… - name"
scontrol update node=<n> state=resume
scontrol reboot ASAP nextstate=resume reason="…" <nodes>
scontrol reconfigure                       # or: confreload
sdiag
sacct -j <id> --batch-script
sacctmgr show qos format=name,maxtresperuser -P

# --- Containers ---
docker ps --format '{{.Names}}\t{{.Status}}'
docker logs --since 30m <container>
docker restart skipjack-slurmctld          # or: controllerrestart
docker exec coldfront coldfront <cmd>
cd /opt/cloack && ./start.sh doctor

# --- Fleet ---
pdsh -w '<hostlist>' '<cmd>' | dshbak -c
pdcp -w '<hostlist>' file /dest/
bmc <node> power status|cycle ; bmc <node> sel elist

# --- Storage ---
weka status ; weka alerts ; weka local ps
df -h -t wekafs

# --- Identity ---
id <user> ; sss_cache -E
ldapsearch -x -H ldap://openldap -b dc=arch,dc=cluster "(uid=<user>)"
```
