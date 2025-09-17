const ratioDefault = 3000;
const currentDevPriceDefault = 0.00010216;
const devSupply = 1_000_000_000;
const vitaTotalSupply = 42000000;
const devAddress = 'HDttRtkq8XJKAboqn1PCusyBTEEJpLwmVKQ128Txpump';
function getRViatEstimates(ratio = ratioDefault, currentPrice = currentDevPriceDefault) {
	const pricePerViat = ratio * currentPrice;
	const viatMarketCapEstimate = (pricePerViat * vitaTotalSupply).toLocaleString('en-US');
	console.log(`Price per VIAT based on ${ratio} $DEV x 1 $VIAT RATIO: ${pricePerViat} & Market Cap Estimate: $${viatMarketCapEstimate}`);
}
// Your token
const getTokenPrice = async (tokenAddress = devAddress) => {
	const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
	const data = await response.json();
	const pair0 = data.pairs?.[0];
	const priceUsd = pair0?.priceUsd;
	return parseFloat(priceUsd);
};
getRViatEstimates(ratioDefault, await getTokenPrice());
