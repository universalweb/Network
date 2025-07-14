# Block Path Structure

/wallets/
  oK1Z/                ← wallet hash[0:3] → 3 bytes → 4 chars
  Xos6/                ← wallet hash[3:6] → 3 bytes → 4 chars
  Dkkzwf8ykl_oHdI1bkCE9_h9dAHDK9-H/   ← wallet hash[-24:] → 32 chars
/transactions/
  VQ/                  ← tx hash[0] → 1 byte → 2 chars
  Lg/                  ← tx hash[1] → 1 byte → 2 chars
  tZLu3FrEVKV-O3LYTfWYfpTozjz92KUr/   ← tx hash[-24:] → 32 chars
/vtx.block             ← fixed filename


| Hash Section   | Bytes | Base64URL Chars | Folder Use           |
| -------------- | ----- | --------------- | -------------------- |
| `wallet[0:3]`  | 3     | 4 chars         | First wallet folder  |
| `wallet[3:6]`  | 3     | 4 chars         | Second wallet folder |
| `wallet[-24:]` | 24    | 32 chars        | Final wallet folder  |
| `tx[0]`        | 1     | 2 chars         | First tx folder      |
| `tx[1]`        | 1     | 2 chars         | Second tx folder     |
| `tx[-24:]`     | 24    | 32 chars        | Final tx folder      |
