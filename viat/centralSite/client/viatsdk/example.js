import VIATClient from './viatClient.js';
const client = await VIATClient.create({
	baseURL: 'http://localhost:3000/api',
	useCBOR: true,
});
async function testWebAPI() {
	const health = await client.health();
	console.log('Health:', health);
	const account = await client.createAccount('publicKeyExample');
	console.log('Created Account:', account);
	const fetchedAccount = await client.getAccount(account.address);
	console.log('Fetched Account:', fetchedAccount);
	const mintResponse = await client.mintFunds('recipientAddress', 1000);
	console.log('Mint Response:', mintResponse);
	const transactions = await client.getAccountTransactions(account.address);
	console.log('Account Transactions:', transactions);
	const transaction = await client.createTransaction({});
	console.log('Created Transaction:', transaction);
}
async function testCrypto() {
	await client.createSiteWalletInstance();
	await client.createSiteWallet();
	console.log('Wallet Seeds:', client.walletSeeds);
	const keypair = await client.keypair();
	console.log('Keypair:', keypair);
	const trapdoorKeypair = await client.trapdoorKeypair();
	console.log('Trapdoor Keypair:', trapdoorKeypair);
	const signature = await client.sign('Hello, VIAT!', keypair.privateKey);
	console.log('Signature:', signature.length, 'bytes');
	console.log(await client.hdWalletInstance.exportObject());
}
console.log('VIATClient module loaded');
await testCrypto();
