pragma solidity ^0.5.0;

contract LendingPoolAddressesProvider
{
    address private lendingPool;

    constructor(address _pool) public
    {
        lendingPool = _pool;
    }

    function setLendingPool(address _pool) public
    {
        lendingPool = _pool;
    }

    function getLendingPool() public view returns (address)
    {
        return lendingPool;
    }
}
