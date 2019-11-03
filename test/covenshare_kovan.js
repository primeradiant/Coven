const { BN, constants, balance, expectEvent, time } = require('@openzeppelin/test-helpers');
const DAI = artifacts.require('DAI');
const CovenShare = artifacts.require('CovenShare');


const kovanConfig = {
    daiAddress: '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
    aDaiAddress: '0x8Ac14CE57A87A07A2F13c1797EfEEE8C0F8F571A',
    lendingPoolAddress: '0x9C6C63aA0cD4557d7aE6D9306C06C093A2e35408',
};

contract('CovenShare contract', accounts => {

    const ALICE = accounts[0]

    const ALICE_STAKED = new BN('100000000000000000000') // 100 dai, in wei

    let daiToken, covenInstance

    before(async () => {
        console.log(accounts)
        covenInstance = await CovenShare.deployed()
        daiToken = await DAI.at(kovanConfig.daiAddress)
    });

    it('Alice Staking DAI', async () => {
        const poolToken = await covenInstance._poolToken()
        console.log('Pool token ', poolToken.toString())
        await daiToken.approve(CovenShare.address, ALICE_STAKED, { from: ALICE })
        await covenInstance.deposit(ALICE_STAKED, { from: ALICE })

        let bal = await covenInstance.stakedAmount(ALICE)
        // expect(bal.toString()).to.equal(ALICE_STAKED.toString())
        expect((bal.toString() * 1).toPrecision(5)).to.equal((ALICE_STAKED.toString() * 1).toPrecision(5))
    })

    it('Total staking DAI', async () => {
        const totalStaked = await covenInstance.getTotalStaked()
        console.log(totalStaked.toString())
        expect(totalStaked.toString()).to.equal(ALICE_STAKED.toString())
        const totalBal = await covenInstance.getTotalBalance()
        console.log(totalBal.toString())
    })
})
