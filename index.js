require('dotenv').config();
console.log(process.env.RPC_URL);

const { ethers } = require('ethers');
const fs = require('fs');

const url = process.env.RPC_URL; // Load URL from .env
console.log(url, 'url');

const provider = new ethers.providers.JsonRpcProvider(url);
const privateKey = process.env.PRIVATE_KEY; 
const wallet = new ethers.Wallet(privateKey, provider);

console.log(provider, 'provider');

// Addresses and ABI
const swapRouterAddress = process.env.SWAP_ROUTER_ADDRESS;
const alfaFeedAddress = process.env.ALFA_FEED_ADDRESS;
const wethAddress = process.env.WETH_ADDRESS;

const swapRouterABI = require('./api.json').abi;

const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, wallet);
const alfaFeedToken = new ethers.Contract(alfaFeedAddress, erc20ABI, wallet);

async function swapETHForAlfaFeed(amountETH, amountOutMin) {
    try {
        // Gas estimation
        const estimatedGas = await swapRouter.estimateGas.swapExactETHForTokens(
            ethers.utils.parseUnits(amountOutMin, 'ether'),
            [wethAddress, alfaFeedAddress],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            { value: ethers.utils.parseEther(amountETH) }
        );

        console.log(`Estimated gas: ${estimatedGas.toString()}`);

        const tx = await swapRouter.swapExactETHForTokens(
            ethers.utils.parseUnits(amountOutMin, 'ether'),
            [wethAddress, alfaFeedAddress],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            {
                value: ethers.utils.parseEther(amountETH),
                gasLimit: estimatedGas.mul(120).div(100) // Add 20% to the gas estimate for buffer
            }
        );

        console.log(`Swap ETH -> AlfaFeed, tx hash: ${tx.hash}`);
        await tx.wait();
    } catch (error) {
        console.error(`Error swapping ETH for AlfaFeed: ${error.message}`);
    }
}



async function swapAlfaFeedForETH(amountTokens, amountOutMinETH) {
    const approveTx = await alfaFeedToken.approve(swapRouterAddress, ethers.utils.parseUnits(amountTokens, 'ether'));
    await approveTx.wait();
    console.log(`Approval tx hash: ${approveTx.hash}`);

    const tx = await swapRouter.swapExactTokensForETH(
        ethers.utils.parseUnits(amountTokens, 'ether'), // Amount of tokens to swap
        ethers.utils.parseUnits(amountOutMinETH, 'ether'), // Minimum amount of ETH to receive
        [alfaFeedAddress, wethAddress], // Swap path
        wallet.address, // Recipient address
        Math.floor(Date.now() / 1000) + 60 * 20 // Deadline
    );
    console.log(`Swap AlfaFeed -> ETH, tx hash: ${tx.hash}`);
    await tx.wait();
}

// Function calls (example)
swapETHForAlfaFeed('0.004', '0.0001').catch(console.error);

// swapAlfaFeedForETH('10', '0.0001');
