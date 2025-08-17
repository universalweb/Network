# FILESYSTEM INFO

The VIAT Superstructure is open to various strategies and configurations so long as the queries are returning the correct data. The VIAT superstructure is highly modular and open to adjustments and modifications to improve response times, data recovery, and scaling. Think of it like an engine that can be tuned to your specifications. The superstructure is designed specifically for modern hardware, networks, operating systems, and filesystems. A client can use whatever they wish and this should only be applied to full nodes or nodes doing significant amount of work.

For the majority of light clients the file count is low and the storage is more than enough even if they were to store their entire wallet chain on disk. It is more than likely that the vast majority will only be storing the TX Chain, Proof Blocks, and Receipt DAG. If space-saving was desired they could store only the proof chain and only need to keep interactive receipt blocks which such as hash-locks. They do not have to store the TX chain as TX blocks can be generated on the fly from proof blocks. Modern light clients still use SSDs and modern filesystems. Clients could store their wallet state in a singular file if so desired.

## REQUIREMENTS

Full node filesystem requirements and recommendations. The choice you make must be based on what hardware is available to you. We may provide config and or details but only use what applies to your hardware and operating system.

SOLID STATE DRIVES ONLY

## LINUX

### Filesystem Overview

### XFS (LINUX)

Max no. of files: 2^64
Max filename length: 255 bytes

"XFS is a high-performance 64-bit journaling filesystem and was ported to the Linux kernel in 2001. XFS excels in the execution of parallel input/output (I/O) operations due to its design. XFS design enables extreme scalability of I/O threads, filesystem bandwidth, size of files, and the filesystem itself when spanning multiple physical storage devices. XFS ensures the consistency of data by employing metadata journaling and supporting write barriers. Space allocation is performed via extents with data structures stored in B+ trees, improving the overall performance of the file system, especially when handling large files."

XFS filesystem optimization delivers exceptional scalability for millions of small files. XFS emerges as the superior choice for this use case through its sophisticated B+ tree architecture and specialized features. The free inode B-tree was specifically designed to "improve performance on aged filesystems with millions of files".

Key XFS advantages include logarithmic scaling with O(log_b n) complexity where b can reach 254, enabling efficient handling of tens of thousands of files per directory.

The extent-based allocation reduces metadata overhead compared to block-based systems, while allocation groups enable parallel operations across directory trees.

### For optimal XFS deployment, use these filesystem creation parameters


```bash
mkfs.xfs -f -b size=4096 -i size=512,maxpct=75 -d agcount=8 -l size=256m -m crc=1,finobt=1
```

### Mount with optimized options

```bash
mount -o noatime,inode64,logbsize=256k,allocsize=1m
```

## APFS

64-bit inodes support over 9 quintillion files per volume
APFS optimization leverages copy-on-write benefits for immutable data
APFS excels with immutable files due to its copy-on-write architecture being ideal for write-once-read-many patterns.
APFS B-tree implementation uses variable-length keys efficiently storing hash-based directory names
Critical APFS considerations include maintaining under 10,000 files per directory for optimal performance, as enumeration performance degrades linearly beyond this threshold. The system's space sharing and multi-key encryption provide additional benefits for wallet applications.
<https://jtsylve.blog/post/2022/12/08/APFS-BTrees>
