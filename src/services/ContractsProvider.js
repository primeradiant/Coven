
import Web3 from 'web3';
import BN from 'bn.js';
import contractConfig from '../config.js';

const blocksPerYear = new BN('2102666');
const e14 = new BN('100000000000000');
const e18 = new BN('1000000000000000000');

class ContractsProvider {
  constructor() {
    if (!window.web3) {
      console.error('There was an error connecting to web3');
    } else {
      this.web3 = new Web3(window.web3.currentProvider);
    }
  }

  async init() {
    try {
      const accounts = await this.web3.eth.getAccounts();
      if (accounts.length == 0) {
        alert("Please login to the wallet")
      }
      this.account = accounts.toString();
      this.networkId = await this.web3.eth.net.getId();
      this.IERC20 = new this.web3.eth.Contract(contractConfig.tokenAbi, contractConfig.tokenAddress)
      this.covenContract = new this.web3.eth.Contract(contractConfig.abi, contractConfig.address)
      this.active = true

    } catch (error) {
      alert(error + ", Please check if you have logged in to your wallet")
    }
  }

  async getData() {
    if (this.active) {
      let members = await this.covenContract.methods._members(this.account).call();
      const borrowRate = await this.getBorrowRate()
      const blockNumber = await this.web3.eth.getBlockNumber()
      if (members) {
        members.staked = new BN(members.staked) / 10 ** 18
        members.borrowed = new BN(members.borrowed) / 10 ** 18
        members.interestAmount = members.borrowed * borrowRate * (blockNumber - members.updated) / 10 ** 18
      }
      return members;
    }
  }

  async getTotalStakedBalance() {
    if (this.active) {
      const amountWei = await this.IERC20.methods.balanceOf(this.covenContract._address).call()
      return amountWei / 10 ** 18
    }
  }

  async accrueInterest() {
    await this.covenContract.methods._members(this.account).send({ from: this.account });
  }

  async getBorrowRate() {
    if (this.active) {
      let blockBorrowRate = await this.covenContract.methods._borrowingRate().call();
      return blocksPerYear * blockBorrowRate / 10 ** 18;
    }
  }

  async vouchFor(address) {
    if (this.active) {
      await this.covenContract.methods.vouchFor(address).send({ from: this.account });
      return;
    }
  }

  async getBackees() {
    if (this.active) {
      let backees = await this.covenContract.methods.getBackeesFrom(this.account).call();
      return backees;
    }
  }

  async pendingShares() {
    if (this.active) {
      let pendingShares = await this.covenContract.methods.pendingShares(this.account).call();
      pendingShares = new BN(pendingShares) / 10 ** 18
      let balance = await this.covenContract.methods.balanceOf(this.account).call();
      balance = new BN(balance) / 10 ** 18
      return pendingShares + balance;
    }
  }

  async getCreditLimit() {
    if (this.active) {
      try {
        let creditLimit = await this.covenContract.methods.getCreditLimit(this.account).call();
        creditLimit = new BN(creditLimit) / 10 ** 18
        return creditLimit;
      } catch (error) {
        alert('no vouch address')
        return 0
      }
    }
  }

  async deposit(amount) {
    if (this.active) {
      amount = new BN((parseFloat(amount) * e14).toString()).mul(new BN('10000'))
      const allowance = await this.IERC20.methods.allowance(this.account, this.covenContract._address).call()
      if (new BN(allowance).lt(amount)) {
        await this.IERC20.methods.approve(this.covenContract._address, '-1').send({ from: this.account });
      }
      await this.covenContract.methods.deposit(amount.toString()).send({ from: this.account });
    }
  }

  async withdraw(amount) {
    if (this.active) {
      amount = new BN((parseFloat(amount) * e14).toString()).mul(new BN('10000'));
      await this.covenContract.methods.withdraw(amount.toString()).send({ from: this.account });
    }
  }

  async borrow(amount) {
    if (this.active) {
      amount = new BN((parseFloat(amount) * e14).toString()).mul(new BN('10000'))
      await this.covenContract.methods.borrow(amount.toString()).send({ from: this.account });
    }
  }

  async repay(amount) {
    if (this.active) {
      amount = new BN((parseFloat(amount) * e14).toString()).mul(new BN('10000'))
      const allowance = await this.IERC20.methods.allowance(this.account, this.covenContract._address).call()
      if (new BN(allowance).lt(amount)) {
        await this.IERC20.methods.approve(this.covenContract._address, '-1').send({ from: this.account });
      }
      await this.covenContract.methods.repay(amount.toString()).send({ from: this.account });
    }
  }
}

export default ContractsProvider;
