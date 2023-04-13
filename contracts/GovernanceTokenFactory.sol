// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
import "./interfaces/IGovernanceTokenFactory.sol";
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
        require(msg.sender == owner, "permission: only Owner");
        _;
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
        uint256 totalSupply,
        address[] memory stakeholders,
        uint256[] memory percentages
    ) public onlytokengenerator returns (address) {
        require(
            stakeholders.length == percentages.length,
            "Stakeholders and percentages arrays must have the same length"
        );

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

    function tokenDistribution(
        address[] memory stakeholders,
        uint256[] memory percentages
    ) internal returns (uint256[]) {
        // Calculate and distribute token amounts based on percentage ownership
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < stakeholders.length; i++) {
            totalPercentage += percentages[i];
            uint256 amount = (totalSupply * percentages[i]) / 100;
            newToken.transfer(stakeholders[i], amount);
        }
        require(
            totalPercentage == 100,
            "Percentage ownership must add up to 100"
        );
    }
}
