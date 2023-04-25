// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
import "./GovernanceToken.sol";

contract GovernanceTokenFactory {
    event TokenCreated(address tokenAddress, address creator);

    address public tokengenerator;
    address private owner;
    //address of tokegenerator - controlled by us

    modifier onlytokengenerator() {
        require(msg.sender == tokengenerator, "permission: only Factory");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function settokengenerator(
        address _tokengenerator
    ) external onlyOwner returns (address) {
        tokengenerator = _tokengenerator;
        return tokengenerator;
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply //target capital raise
    ) public onlytokengenerator returns (address) {
        // Create a new governance token contract
        GovernanceToken newToken = new GovernanceToken(
            name,
            symbol,
            totalSupply,
            msg.sender
        );

        emit TokenCreated(address(newToken), msg.sender); //msg.sender is the gp
        return address(newToken);
    }
}
