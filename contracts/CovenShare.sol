pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

import "./aave/ILendingPoolAddressesProvider.sol";

contract AToken is ERC20
{
    function redeem(uint256 _amount) public;
    function balanceOfUnderlying(address _user) public view returns (uint256);
    function getExchangeRate() public view returns (uint256);
}

contract LendingPool
{
    function deposit(address _reserve, uint256 _amount, uint16 _referralCode)
        external payable;
}

contract CovenShare is ERC20, ERC20Detailed {
    using SafeMath for uint256;

    event LogDeposit(address sender, uint256 staked, uint256 updated, uint256 bal);
    event LogWithdraw(address sender, uint256 staked, uint256 updated, uint256 bal);
    event LogVouch(address backer, address borrower, uint256 amount);

    struct Member {
        uint256 borrowed; // debit position
        uint256 staked; // in wei, which means 1e18 means 100%
        uint256 updated; // latest updated block number
        address[] backers; // backers for the member
        address[] backees; // beneficiaries from this member
    }

    uint256 public _mintingRate = 475586707540000; // per block
    uint256 public _borrowingRate = 47558670754; // per block

    address public _poolToken;
    ILendingPoolAddressesProvider public _poolProvider;
    AToken public _aToken;

    mapping(address=>Member) public _members;

    constructor(address token, address poolProvider, address aToken)
        public
        ERC20Detailed("Coven Share", "CVN", 18)
    {
        _poolToken = token;
        _poolProvider = ILendingPoolAddressesProvider(poolProvider);
        _aToken = AToken(aToken);
    }

    function deposit(uint256 amount)
        external
        returns (uint256 result)
    {
        require(
            amount > 0,
            "Deposit amount needs to be greater than 0"
        );

        // Send exisiting UNS tokens, ie. interest, to the user
        if (this.pendingShares(msg.sender) > 0)
            _mint(msg.sender, this.pendingShares(msg.sender));

        require(
            IERC20(_poolToken).transferFrom(msg.sender, address(this), amount),
            "Receive token failed"
        );

        // uint256 senderAmount = stakedAmount(msg.sender) + amount;
        _members[msg.sender].staked += amount;
        _members[msg.sender].updated = block.number;

        depositToPool(amount);

        emit LogDeposit(msg.sender, _members[msg.sender].staked, _members[msg.sender].updated, balanceOf(msg.sender));

        result = 0;
    }

    function withdraw(uint256 amount)
        external
        returns (uint256 result)
    {
        require(
            _members[msg.sender].staked >= amount,
            "Cannot withdraw more than the staked amount"
        );

        // Send exisiting UNS tokens, ie. interest, to the user
        _mint(msg.sender, this.pendingShares(msg.sender));

        _members[msg.sender].staked -= amount;
        _members[msg.sender].updated = block.number;

        // Redeem from the lendingPool
        withdrawFromPool(amount);

        emit LogWithdraw(msg.sender, _members[msg.sender].staked, _members[msg.sender].updated, this.balanceOf(msg.sender));

        result = 0;
    }


    function stakedAmount(address account)
        public
        view
        returns(uint256)
    {
        return _members[account].staked; // * _poolToken.balanceOf(address(this)) / 1e18;
    }

    function pendingShares(address account)
        public
        view
        returns (uint256)
    {
        return ((block.number - _members[account].updated) * _mintingRate * _members[account].staked) / 1e18;
    }

    function vouchFor(address account)
        public
    {
        _members[account].backers.push(msg.sender);
        _members[msg.sender].backees.push(account);
        emit LogVouch(_members[account].backers[0], account, _members[msg.sender].staked);
    }

    function getCreditLimit(address account)
        public
        view
        returns (uint256 credit)
    {
        address voucher = _members[account].backers[0];
        credit = 0;
        if (_members[voucher].staked > _members[account].borrowed)
            credit = _members[voucher].staked - _members[account].borrowed;

        // address[] memory vouchers = _members[account].backers;
        // uint[] memory vouchAmounts = new uint[](256);
        // for (uint i = 0; i < vouchers.length; i++) {
        //     uint amt = stakedAmount(vouchers[i]);
        //     vouchAmounts[i] = amt;
        // }

        // quickSort(vouchAmounts, 0, vouchAmounts.length - 1);
        // return vouchAmounts[vouchAmounts.length / 2];
    }

    function getTotalStaked()
        public
        view
        returns (uint256 total)
    {
        // total = _aToken.balanceOfUnderlying(address(this));
        total = IERC20(_poolToken).balanceOf(address(this));
    }

    function getTotalBalance()
        public
        view
        returns (uint256 total)
    {
        // total = getTotalStaked() * _aToken.getExchangeRate();
        total = IERC20(_poolToken).balanceOf(address(this));
    }

    function getBackersFor(address account)
        public
        view
        returns (address[] memory)
    {
        return _members[account].backers;
    }

    function getBackeesFrom(address account)
        public
        view
        returns (address[] memory)
    {
        return _members[account].backees;
    }

    function borrow(uint256 amount)
        public
    {
        require (
            getCreditLimit(msg.sender) >= amount,
            "Not enough credit to borrow"
        );

        require (
            getTotalStaked() >= amount,
            "Not enough tokens to lend out"
        );

        _members[msg.sender].borrowed += amount;

        // Get token out of the lendingPool
        withdrawFromPool(amount);
    }

    function repay(uint256 amount)
        public
    {
        require(
            IERC20(_poolToken).transferFrom(msg.sender, address(this), amount),
            "Failed to receive repayment"
        );
        if (amount > _members[msg.sender].borrowed)
            _members[msg.sender].borrowed = 0;
        else
            _members[msg.sender].borrowed -= amount;

        depositToPool(amount);
    }

    function setBorrowingRate(uint256 rate)
        public
    {
        _borrowingRate = rate;
    }

    function setMintingRate(uint256 rate)
        public
    {
        _mintingRate = rate;
    }

    /// Aave functions

    function depositToPool(uint256 amount)
        internal
    {
        // /// Retrieve LendingPool address
        // LendingPool lendingPool = LendingPool(_poolProvider.getLendingPool());
        // IERC20(_poolToken).approve(address(lendingPool), amount);
        // /// Deposit method call
        // lendingPool.deposit(_poolToken, amount, 0);
    }

    function withdrawFromPool(uint256 amount)
        internal
    {
        // _aToken.redeem(amount);

        // IERC20(_poolToken).transfer(msg.sender, IERC20(_poolToken).balanceOf(address(this)));
        IERC20(_poolToken).transfer(msg.sender, amount);
    }

    function accrueInterest()
        external
    {
        uint256 bal = _aToken.balanceOf(address(this));
        _aToken.redeem(bal);
    }


    function _quickSort(uint[] memory arr, uint left, uint right)
        internal
        pure
    {
        uint i = left;
        uint j = right;
        uint pivot = arr[left + (right - left) / 2];
        while (i <= j) {
            while (arr[i] < pivot) i++;
            while (pivot < arr[j]) j--;
            if (i <= j) {
                (arr[i], arr[j]) = (arr[j], arr[i]);
                i++;
                j--;
            }
        }
        if (left < j)
            _quickSort(arr, left, j);
        if (i < right)
            _quickSort(arr, i, right);
    }
}