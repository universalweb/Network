Wallet A (Linear TX Chain)                     Wallet B (DAG Receipt Chain)
+--------------------+                        +----------------------+
| Wallet Block       |                        | Receipt DAG Root     |
| (pub keys, addr)   |                        |                      |
+--------------------+                        +----------------------+
          |                                           ^
          v                                           |
+--------------------+                                |
| TX Block #1        |                                |
+--------------------+                                |
          |                                           |
          v                                           |
          |
          v
+--------------------+
| TX Block #2        |
+--------------------+
