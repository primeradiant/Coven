pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract AToken is ERC20, ERC20Detailed, ERC20Mintable {
    uint256 public INITIAL_SUPPLY = 21 * 10 ** 24;

    address public _underlying;

    constructor(address underlying) ERC20Detailed("Mock aDAI", "aDAI", 18) public {
        _underlying = underlying;
    }

    function redeem(uint256 _amount) external {
        ERC20Mintable(_underlying).mint(msg.sender, _amount);
    }

    function balanceOfUnderlying(address _user) public view returns (uint256) {
        return balanceOf(_user);
    }

    function getExchangeRate() public view returns (uint256) {
        return 1;
    }
}