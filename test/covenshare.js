const { BN, constants, balance, expectEvent, time } = require('@openzeppelin/test-helpers');
const DAI = artifacts.require('DAI');
const CovenShare = artifacts.require('CovenShare');


contract('CovenShare contract', accounts => {

    const ALICE = accounts[0]
    const BOB = accounts[1]
    const CHARLIE = accounts[2]
    const DAVID = accounts[3]

    const ALICE_STAKED = new BN('1000000000000000000000') // 1000 dai, in wei
    const BOB_STAKED = new BN('500000000000000000000') // 500 dai, in wei
    const CHARLIE_STAKED = new BN('1000000000') // minimum 1gwei

    let daiToken, covenInstance

    before(async () => {
        daiToken = await DAI.deployed()
        covenInstance = await CovenShare.deployed()
    });

    it('Alice Staking DAI', async () => {
        await daiToken.approve(CovenShare.address, ALICE_STAKED, { from: ALICE })
        await covenInstance.deposit(ALICE_STAKED, { from: ALICE })

        let bal = await covenInstance.stakedAmount(ALICE)
        // expect(bal.toString()).to.equal(ALICE_STAKED.toString())
        expect((bal.toString() * 1).toPrecision(5)).to.equal((ALICE_STAKED.toString() * 1).toPrecision(5))
    })

    it('Bob Staking DAI', async () => {
        await daiToken.approve(CovenShare.address, BOB_STAKED, { from: BOB })
        await covenInstance.deposit(BOB_STAKED, { from: BOB })

        let bal = await covenInstance.stakedAmount(BOB)
        expect((bal.toString() * 1).toPrecision(5)).to.equal((BOB_STAKED.toString() * 1).toPrecision(5))
        // expect(bal.toNumber(10)).to.equal(BOB_STAKED.toNumber(10))
    })

    it('Charlie staking DAI', async () => {
        await daiToken.approve(CovenShare.address, CHARLIE_STAKED, { from: CHARLIE })
        await covenInstance.deposit(CHARLIE_STAKED, { from: CHARLIE })

        let bal = await covenInstance.stakedAmount(CHARLIE)
        expect((bal.toString() * 1).toPrecision(5)).to.equal((CHARLIE_STAKED.toString() * 1).toPrecision(5))
    })

    it('Total staking DAI', async () => {
        const totalStaked = await covenInstance.getTotalStaked()
        console.log(totalStaked.toString())
        expect(totalStaked.toString()).to.equal((ALICE_STAKED.add(BOB_STAKED).add(CHARLIE_STAKED)).toString())
        const totalBal = await covenInstance.getTotalBalance()
        console.log(totalBal.toString())
    })

    it('Vouching for David', async () => {
        await covenInstance.vouchFor(DAVID, { from: BOB })
        const credit = await covenInstance.getCreditLimit(DAVID)
        console.log('David available credits ', credit.toString())
        const backers = await covenInstance.getBackersFor(DAVID)
        // console.log('David\'s backers ', )
        console.log({ backers })
        const backees = await covenInstance.getBackeesFrom(BOB)
        console.log({ backees })

        expect(credit.toString()).to.equal(BOB_STAKED.toString())
    })

    // it('David borrowing', async () => {
    //     await covenInstance.borrow(BOB_STAKED, { from: DAVID })
    //     const member = await covenInstance._members(DAVID)
    //     console.log('David debt amount: ', member['borrowed'].toString())
    //     expect(member['borrowed'].toString()).to.equal(BOB_STAKED.toString())
    // })

    // it('David paying back', async () => {
    //     let member = await covenInstance._members(DAVID)
    //     await daiToken.approve(CovenShare.address, member['borrowed'], { from: DAVID })
    //     await covenInstance.repay(member['borrowed'], { from: DAVID })
    //     member = await covenInstance._members(DAVID)
    //     console.log('David debt amount: ', member['borrowed'].toString())
    //     expect(member['borrowed'].toString()).to.equal('0')
    // })

    // it('Total staking DAI', async () => {
    //     const total = await covenInstance.getTotalStaked()
    //     expect(total.toString()).to.equal((ALICE_STAKED.add(BOB_STAKED).add(CHARLIE_STAKED)).toString())
    // })

})
