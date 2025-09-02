[Viat Transaction]
  |
  +--> TX Block (sender’s linear chain)
  |
  |
  +--> Receipt Block (receiver’s DAG chain)

/wallets/
  <hash[0:1]>/
    <hash[1:2]>/
      <hash[2:3]>/
        <wallet_id>/

/transactions/
  <tx_hash[0]>/
    <tx_hash[1]>/
      <tx_hash[last12]>/
        vtx.block

