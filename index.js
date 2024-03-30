require('dotenv').config();
console.log(process.env.RPC_URL);

const { ethers } = require('ethers');
const fs = require('fs');

const url = process.env.RPC_URL; // Загрузка URL из .env
console.log(url, 'url');

const provider = new ethers.providers.JsonRpcProvider(url);
const privateKey = process.env.PRIVATE_KEY; 
const wallet = new ethers.Wallet(privateKey, provider);

console.log(provider, 'provider');

// Адреса и ABI
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
        // Оценка газа
        const estimatedGas = await swapRouter.estimateGas.swapExactETHForTokens(
            ethers.utils.parseUnits(amountOutMin, 'ether'),
            [wethAddress, alfaFeedAddress],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            { value: ethers.utils.parseEther(amountETH) }
        );

        console.log(`Оценочный газ: ${estimatedGas.toString()}`);

        const tx = await swapRouter.swapExactETHForTokens(
            ethers.utils.parseUnits(amountOutMin, 'ether'),
            [wethAddress, alfaFeedAddress],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            {
                value: ethers.utils.parseEther(amountETH),
                gasLimit: estimatedGas.mul(120).div(100) // Добавляем 20% к оценке газа для запаса
            }
        );

        console.log(`Swap ETH -> AlfaFeed, tx hash: ${tx.hash}`);
        await tx.wait();
    } catch (error) {
        console.error(`Ошибка при свопе ETH на AlfaFeed: ${error.message}`);
    }
}



async function swapAlfaFeedForETH(amountTokens, amountOutMinETH) {
    const approveTx = await alfaFeedToken.approve(swapRouterAddress, ethers.utils.parseUnits(amountTokens, 'ether'));
    await approveTx.wait();
    console.log(`Approval tx hash: ${approveTx.hash}`);

    const tx = await swapRouter.swapExactTokensForETH(
        ethers.utils.parseUnits(amountTokens, 'ether'), // Количество токенов для свопа
        ethers.utils.parseUnits(amountOutMinETH, 'ether'), // Минимальное количество ETH для получения
        [alfaFeedAddress, wethAddress], // Путь свопа
        wallet.address, // Адрес получателя
        Math.floor(Date.now() / 1000) + 60 * 20 // Deadline
    );
    console.log(`Swap AlfaFeed -> ETH, tx hash: ${tx.hash}`);
    await tx.wait();
}

// Вызов функций (пример)
swapETHForAlfaFeed('0.004', '0.0001').catch(console.error);

// swapAlfaFeedForETH('10', '0.0001);
