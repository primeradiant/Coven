pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract DAI is ERC20, ERC20Detailed {
    uint256 public INITIAL_SUPPLY = 21 * 10 ** 24;

    constructor() ERC20Detailed("Mock DAI", "DAI", 18) public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}