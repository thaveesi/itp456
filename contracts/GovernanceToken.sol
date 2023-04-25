// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GovernanceToken is ERC20 {
    address public owner;
    uint256 public proposalCount;
    uint256 public voteTimeLimit;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public stakeholders; // Add this line to keep track of the stakeholders

    struct Proposal {
        uint256 id;
        string snapshoturl;
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

    modifier onlyLP() {
        require(stakeholders[msg.sender], "permission: only LP"); // Check if the user is a stakeholder
        _;
    }

    event GovernanceVote(
        address indexed voter,
        uint256 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst
    );
    event NewGovernanceProposal(uint256 indexed proposalId, string description);

    event voteEndingtime(uint256 endTime);

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
        address[] memory stakeholderAddresses, // Corrected variable name
        uint256[] memory percentages,
        uint256 totalSupply
    ) external onlyOwner {
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < stakeholderAddresses.length; i++) {
            totalPercentage += percentages[i];
            uint256 amount = (totalSupply * percentages[i]) / 100;
            transferFrom(owner, stakeholderAddresses[i], amount);
            stakeholders[stakeholderAddresses[i]] = true; // mark the address as a stakeholder
        }
        require(
            totalPercentage == 100,
            "Percentage ownership must add up to 100"
        );
    }

    //save url id in the smart contract, its a url to json
    //create it in the snapshot UI

    //Index proposal events
    function createProposal(
        string memory snapshotUrl, //use snapshot to store description instead //instead of that lets just emit this as an event and index with subgraph
        uint256 _endTime
    ) public onlyLP {
        proposalCount++;

        Proposal storage newProposal = proposals[proposalCount];
        newProposal.id = proposalCount;
        newProposal.snapshoturl = snapshotUrl;
        newProposal.voteCountYes = 0;
        newProposal.voteCountNo = 0;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + _endTime;

        // The newProposal.hasVoted mapping is already initialized by default.
        emit NewGovernanceProposal(newProposal.id, snapshotUrl);
        emit voteEndingtime(newProposal.endTime);
    }

    function updateProposal(
        uint256 _proposalId,
        string memory _snapshotUrl,
        uint256 _endTime
    ) public onlyOwner {
        require(
            _proposalId > 0 && _proposalId <= proposalCount,
            "Invalid proposal ID"
        );
        Proposal storage proposal = proposals[_proposalId];

        if (bytes(_snapshotUrl).length > 0) {
            proposal.snapshoturl = _snapshotUrl;
        }

        if (_endTime != 0) {
            proposal.endTime = block.timestamp + _endTime;
        }
    }

    //Index events of each vote by the graph
    //If we are using snapshot voting system, does that mean i no longer need this function?
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

        // 0 ,5000 a1, 7000 a2

        return true;
    }
}
