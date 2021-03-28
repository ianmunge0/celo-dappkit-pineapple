// Learn more about Solidity here: https://solidity.readthedocs.io

// This statement specifies the compatible compiler versions
pragma solidity >=0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyCollectible is ERC20 {
    constructor() public ERC20("MyCollectible", "MCO") {
    }
}
