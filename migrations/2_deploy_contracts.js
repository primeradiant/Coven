
const DAI = artifacts.require("DAI");
const ADAI = artifacts.require("AToken");
const LendingPoolAddressesProvider = artifacts.require("LendingPoolAddressesProvider");
const LendingPool = artifacts.require("LendingPool");
const CovenShare = artifacts.require("CovenShare");

const kovanConfig = {
    daiAddress: '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
    aDaiAddress: '0x8Ac14CE57A87A07A2F13c1797EfEEE8C0F8F571A',
    lendingPoolAddress: '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408',
};

const ALLOWANCE = '100000000000000000000000'

module.exports = async function (deployer, network, accounts) {
    console.log('Network is: ', network)
    console.log(accounts)

    if (network === 'development' || network === 'test') {
        await deployer.deploy(DAI)
        const dai = await DAI.deployed()
        dai.transfer(accounts[1], ALLOWANCE, { from: accounts[0] })
        dai.transfer(accounts[2], ALLOWANCE, { from: accounts[0] })

        await deployer.deploy(ADAI, DAI.address)
        const aDAI = await ADAI.deployed()
        aDAI.addMinter(LendingPool.address)

        await deployer.deploy(LendingPool, ADAI.address)
        await deployer.deploy(LendingPoolAddressesProvider, LendingPool.address)

        await deployer.deploy(CovenShare, DAI.address, LendingPoolAddressesProvider.address, ADAI.address);
    }
    else if (network === 'kovan') {
        await deployer.deploy(CovenShare, kovanConfig.daiAddress, kovanConfig.lendingPoolAddress, kovanConfig.aDaiAddress)
    }
};
