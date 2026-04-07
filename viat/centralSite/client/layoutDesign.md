# New Viat Wallet Layout design

This wallet design is desktop and tablet focused panel based design.

Base the new wallet/block explorer site design off of these prototypes that are located in the client folder:

- prototype1.html (Use only The bottom panel with info in the new design)
- prototype2.html (The general panel layout of this prototype is the goal)
- prototype6.html (Use the top panel bar from this prototype)

The full view is a dashboard terminal panel centered on screen with padding around the edges so that the panel remains in the center of the screen with balanced white space around it. The full dashboard panel consists of different panels.

Top panel Bar

Left Side panel Navigational Items/Tabs:

- Account panel
	- Profile Info
	- Export
	- Settings
	- Show Cryptography Info
	- Show cryptographic identity

- Wallet
- Faucet

Transmit Funds Panel:

- Amount to transfer
- Gas amount (Set to 0 none editable)
	- Small text Fee estimate under gas amount
- Transmit/Send Button (Initiate Transfer)
- Address

Verbose System Output panel:

- Full system logs
- Account specific action logs

Node/Network Stat panel:

- Peer amount
- Network Version Name
- Latency
- Connection Type (HTTP Hybrid Post-Quantum)

Wallet Amount Panel:

- Display Short Summary amount
- Display full amount in smaller text
- Display Viat info with symbol

The bottom panel consists of columns like a footer which contains verbose diagnostic information such as:

- Application & Client Info
- Viat Info
- Network/Node Info
- Wallet Info
- Domain URL Info
- Site Info
