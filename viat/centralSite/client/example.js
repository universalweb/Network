import viatClient from './index.js';
/**
 * Example usage of the VIAT API Client
 * Demonstrates basic operations with both JSON and CBOR.
 */
async function example() {
	try {
		console.log('🚀 VIAT Client Example\n');
		// Health check
		console.log('1. Health Check:');
		const health = await viatClient.health();
		console.log('   Status:', health.status);
		console.log('   Service:', health.service);
		console.log('   ✅ Server is healthy\n');
		// Create test accounts
		console.log('2. Creating Test Accounts:');
		// Alice's account
		const aliceKey = Buffer.alloc(32);
		aliceKey.write('alice_public_key_32_bytes!');
		const aliceAccount = await viatClient.createAccount(aliceKey);
		console.log('   Alice account created:', aliceAccount.account.address);
		// Bob's account
		const bobKey = Buffer.alloc(32);
		bobKey.write('bob_public_key_32_bytes!!!');
		const bobAccount = await viatClient.createAccount(bobKey);
		console.log('   Bob account created:', bobAccount.account.address);
		console.log('   ✅ Accounts created\n');
		// Mint funds to Alice
		console.log('3. Minting Initial Funds:');
		await viatClient.mintFunds(
			Buffer.from(aliceAccount.account.address, 'base64'),
			1000n
		);
		console.log('   ✅ Minted 1000 tokens to Alice\n');
		// Check balances
		console.log('4. Checking Balances:');
		const aliceBalance = await viatClient.getAccount(aliceAccount.account.address);
		const bobBalance = await viatClient.getAccount(bobAccount.account.address);
		console.log('   Alice balance:', aliceBalance.account.balance);
		console.log('   Bob balance:', bobBalance.account.balance);
		console.log('   ✅ Balances retrieved\n');
		// Get transaction history
		console.log('5. Transaction History:');
		const transactions = await viatClient.getAccountTransactions(
			aliceAccount.account.address,
			{
				page: 1,
				limit: 10,
			}
		);
		console.log('   Found', transactions.transactions.length, 'transactions');
		console.log('   Has more:', transactions.pagination.hasMore);
		console.log('   ✅ Transaction history retrieved\n');
		// Demonstrate CBOR usage
		console.log('6. Switching to CBOR:');
		viatClient.setCBOR(true);
		console.log('   Format:', viatClient.getFormat());
		const cborHealth = await viatClient.health();
		console.log('   CBOR Health check successful');
		console.log('   ✅ CBOR working\n');
		// Switch back to JSON
		viatClient.setCBOR(false);
		console.log('7. Switched back to JSON format');
		// 8. Signature creation & verification tests
		console.log('\n8. Signature creation & verification tests:');
		// Create a fresh ed25519 keypair
		const keypair = viatClient.createKeypair();
		const privateKey = keypair.privateKey;
		const publicKey = keypair.publicKey;
		console.log('   Generated keypair (publicKey length):', publicKey.length);
		// Test signMessage / verifySignature
		const message = 'hello viat signature test';
		const sig1 = await viatClient.signMessage(message, privateKey);
		const ok1 = await viatClient.verifySignature(sig1, message, publicKey);
		console.log('   signMessage -> verifySignature ok:', ok1);
		if (!ok1) {
			throw new Error('signMessage/verifySignature failed');
		}
		// Test signTransaction / verifyTransactionSignature
		// Create dummy 24-byte addresses
		const fromAddr = Buffer.alloc(24, 1);
		const toAddr = Buffer.alloc(24, 2);
		const amount = 123n;
		const sigTx = await viatClient.signTransaction(fromAddr, toAddr, amount, privateKey);
		const ok2 = await viatClient.verifyTransactionSignature(sigTx, fromAddr, toAddr, amount, publicKey);
		console.log('   signTransaction -> verifyTransactionSignature ok:', ok2);
		if (!ok2) {
			throw new Error('signTransaction/verifyTransactionSignature failed');
		}
		console.log('\n🎉 All examples and signature tests completed successfully!');
	} catch (error) {
		console.error('❌ Example failed:', error.message);
		throw error;
	}
}
// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	example();
}
export default example;
