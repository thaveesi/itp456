// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GovernanceToken is ERC20 {
    address public owner;
    uint256 public proposalCount;
    uint256 public voteTimeLimit;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) public allowed;
    mapping(uint256 => Proposal) public proposals;

    struct Proposal {
        uint256 id;
        string description;
        uint256 voteCountYes;
        uint256 voteCountNo;
        uint256 startTime;
        uint256 endTime;
        mapping(address => bool) hasVoted;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "permission: only Owner");
        _;
    }

    event GovernanceVote(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst
    );
    event NewGovernanceProposal(uint256 indexed proposalId, string description);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _owner
    ) ERC20(_name, _symbol) {
        // Assign total supply, owner, and initial balance
        owner = _owner;
        _mint(_owner, _totalSupply);
        proposalCount = 0;
    }

    function tokenDistribution(
        address[] memory stakeholders,
        uint256[] memory percentages,
        uint256 totalSupply
    ) external onlyOwner {
        // Calculate and distribute token amounts based on percentage ownership
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < stakeholders.length; i++) {
            totalPercentage += percentages[i];
            uint256 amount = (totalSupply * percentages[i]) / 100;
            transferFrom(owner, stakeholders[i], amount);
        }
        require(
            totalPercentage == 100,
            "Percentage ownership must add up to 100"
        );
    }

    function createProposal(
        string memory _description, //use snapshot to store description instead
        uint256 _endTime
    ) public {
        proposalCount++;

        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.description = _description;
        newProposal.voteCountYes = 0;
        newProposal.voteCountNo = 0;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + _endTime;

        // The newProposal.hasVoted mapping is already initialized by default.
        emit NewGovernanceProposal(newProposal.id, _description);
    }

    function vote(uint256 _proposalId, bool _voteFor) public returns (bool) {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Invalid proposal ID"
        );
        Proposal storage proposal = proposals[_proposalId];
        require(
            block.timestamp >= proposal.startTime &&
                block.timestamp <= proposal.endTime,
            "Voting period has ended"
        );
        require(
            balanceOf(msg.sender) > 0,
            "You do not have any tokens to vote with"
        );
        require(
            !proposal.hasVoted[msg.sender],
            "You have already voted on this proposal"
        );

        uint256 voteWeight = balanceOf(msg.sender);
        if (_voteFor) {
            proposal.voteCountYes += voteWeight;
        } else {
            proposal.voteCountNo += voteWeight;
        }

        proposal.hasVoted[msg.sender] = true;
        emit GovernanceVote(
            msg.sender,
            _proposalId,
            proposal.voteCountYes,
            proposal.voteCountNo
        );
        return true;
    }
}
