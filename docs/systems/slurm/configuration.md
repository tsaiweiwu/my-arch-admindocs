# Slurm configuration highlights

*From `scontrol show config` on 2026-10-12. Check live values with
`scontrol show config | grep -i <param>`.*

## Scheduling

| Parameter | Value |
|---|---|
| SchedulerType | `sched/backfill` |
| SchedulerParameters | `defer,kill_invalid_depend,batch_sched_delay=20,sched_min_interval=1000000,bf_continue,bf_busy_nodes,bf_max_job_test=100000` |
| SelectType / Params | `select/cons_tres` / `CR_Core_Memory` |
| PreemptType / Mode | `preempt/partition_prio` / `REQUEUE` |
| EnforcePartLimits | `ANY` |
| MaxJobCount / MaxArraySize | 100000 / 10000 |
| MinJobAge | 30 s |
| TopologyPlugin | `topology/flat` |

## Priority

| Parameter | Value |
|---|---|
| PriorityType | `priority/multifactor` |
| PriorityFlags | `MAX_TRES,CALCULATE_RUNNING` |
| Weights | Age 5000, FairShare 20000, JobSize 5000, Partition 0, QOS 0, Assoc 0 |
| DecayHalfLife | 30 days |
| UsageResetPeriod | MONTHLY |
| MaxAge | 7 days |

PriorityTier is used for condo partitions (`h200_condo`, `rtx6000_condo` = 10; `rtx6000` = 5; others 1).

## Accounting

| Parameter | Value |
|---|---|
| AccountingStorageEnforce | `associations,limits,qos` |
| AccountingStoreFlags | `job_comment,job_extra,job_script` (batch scripts are stored: `sacct -j <id> --batch-script`) |
| JobAcctGatherType / Freq | `jobacct_gather/cgroup` / 30 s |
| AcctGatherEnergyType | `acct_gather_energy/rapl` |
| TRES tracked | cpu, mem, energy, node, billing, fs/disk, vmem, pages, gres/gpu + every GPU type, gres/gpumem, gres/gpuutil |

## Node / job control

| Parameter | Value |
|---|---|
| ProctrackType | `proctrack/cgroup` |
| TaskPlugin | `task/cgroup,task/affinity` (`SlurmdOffSpec`) |
| PrologFlags | `Alloc,Contain` |
| PrologEpilogTimeout | 120 s |
| HealthCheck | NHC every 300 s, `ANY,CYCLE` |
| ReturnToService | 2 |
| SlurmdTimeout / SlurmctldTimeout | 300 s / 120 s |
| MessageTimeout | 10 s |
| MpiDefault | `pmix_v3` |
| RebootProgram | `/sbin/reboot` |
| UsePam | no (pam_slurm_adopt is handled by prolog/epilog scripts) |
| SlurmctldDebug | **`verbose`** in the running config (the file says `info`) |

!!! todo "Stub"
    - [ ] Explain each non-default choice (why `defer`, why `bf_max_job_test=100000`)
    - [ ] Preemption: `PreemptType=partition_prio` is set, but which partitions can preempt which? (`scavenger` is referenced by docs and job_submit but isn't defined as a partition)
    - [ ] Why the live `SlurmctldDebug` (verbose) differs from the file (`info`)
    - [ ] Topology-aware scheduling for multi-node GPU jobs
