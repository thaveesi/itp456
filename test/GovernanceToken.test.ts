import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";

describe("GovernanceToken", () => {
  let GovernanceToken: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let ownerAddress: string;
  let addr1Address: string;
  let addr2Address: string;
  let addr3Address: string;

  beforeEach(async () => {
    const GovernanceTokenFactory = await ethers.getContractFactory("GovernanceToken");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    addr1Address = await addr1.getAddress();
    addr2Address = await addr2.getAddress();
    addr3Address = await addr3.getAddress();
  
    GovernanceToken = await GovernanceTokenFactory.deploy("MyToken", "MTK", 1000000, ownerAddress);
    await GovernanceToken.deployed();
    await GovernanceToken.connect(owner).approve(ownerAddress, 1000000);
  });

  it("deploys successfully", async () => {
    expect(GovernanceToken.address).to.not.equal("");
  });

  it("checks initial state", async () => {
    expect(await GovernanceToken.name()).to.equal("MyToken");
    expect(await GovernanceToken.symbol()).to.equal("MTK");
    expect(await GovernanceToken.totalSupply()).to.equal(1000000);
    expect(await GovernanceToken.owner()).to.equal(ownerAddress);
    expect(await GovernanceToken.balanceOf(ownerAddress)).to.equal(1000000);
  });

  it("distributes tokens correctly", async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address];
    const percentages = [40, 30, 30];

    await GovernanceToken.connect(owner).tokenDistribution(stakeholders, percentages, 1000000);

    expect(await GovernanceToken.balanceOf(addr1Address)).to.equal(400000);
    expect(await GovernanceToken.balanceOf(addr2Address)).to.equal(300000);
    expect(await GovernanceToken.balanceOf(addr3Address)).to.equal(300000);
  });

  it("creates a proposal and allows voting", async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address];
    const percentages = [40, 30, 30];

    await GovernanceToken.connect(owner).tokenDistribution(stakeholders, percentages, 1000000);
    await GovernanceToken.connect(addr1).createProposal("bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq", 3600);

    const proposal = await GovernanceToken.proposals(1);
    expect(proposal.id).to.equal(1);
    expect(proposal.snapshoturl).to.equal("bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq");
    expect(proposal.voteCountYes).to.equal(0);
    expect(proposal.voteCountNo).to.equal(0);
    expect(proposal.endTime).to.be.closeTo(proposal.startTime.add(3600), 1);

    await GovernanceToken.connect(addr1).vote(1, true);
    await GovernanceToken.connect(addr2).vote(1, false);
    await GovernanceToken.connect(addr3).vote(1, true);

    const updatedProposal = await GovernanceToken.proposals(1);
    expect(updatedProposal.voteCountYes).to.equal(700000);
    expect(updatedProposal.voteCountNo).to.equal(300000);
  });
});
