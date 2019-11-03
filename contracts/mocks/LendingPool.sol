pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract LendingPool
{
    address public _aToken;

    constructor(address aToken) public
    {
        _aToken = aToken;
    }

    function deposit(address _reserve, uint256 _amount, uint16 _referralCode)
        external payable
    {
        IERC20(_reserve).transferFrom(msg.sender, address(this), _amount);
        ERC20Mintable(_aToken).mint(msg.sender, _amount);
    }
}