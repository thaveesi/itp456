import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { expect } from 'chai'

describe('GovernanceToken', () => {
  let GovernanceToken: Contract
  let owner: Signer
  let addr1: Signer
  let addr2: Signer
  let addr3: Signer
  let addr4: Signer //double check
  let ownerAddress: string
  let addr1Address: string
  let addr2Address: string
  let addr3Address: string
  let addr4Address: string //double check

  beforeEach(async () => {
    const GovernanceTokenFactory = await ethers.getContractFactory(
      'GovernanceToken',
    )
    ;[owner, addr1, addr2, addr3, addr4] = await ethers.getSigners()
    ownerAddress = await owner.getAddress()
    addr1Address = await addr1.getAddress()
    addr2Address = await addr2.getAddress()
    addr3Address = await addr3.getAddress()
    addr4Address = await addr4.getAddress() //double check

    GovernanceToken = await GovernanceTokenFactory.deploy(
      'MyToken',
      'MTK',
      1000000,
      ownerAddress,
    )
    await GovernanceToken.deployed()
    await GovernanceToken.connect(owner).approve(ownerAddress, 1000000)
  })

  it('deploys successfully', async () => {
    expect(GovernanceToken.address).to.not.equal('')
  })

  it('checks initial state', async () => {
    expect(await GovernanceToken.name()).to.equal('MyToken')
    expect(await GovernanceToken.symbol()).to.equal('MTK')
    expect(await GovernanceToken.totalSupply()).to.equal(1000000)
    expect(await GovernanceToken.owner()).to.equal(ownerAddress)
    expect(await GovernanceToken.balanceOf(ownerAddress)).to.equal(1000000)
  })

  it('distributes tokens correctly', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      1000000,
    )

    expect(await GovernanceToken.balanceOf(addr1Address)).to.equal(400000)
    expect(await GovernanceToken.balanceOf(addr2Address)).to.equal(300000)
    expect(await GovernanceToken.balanceOf(addr3Address)).to.equal(300000)
  })

  it('should only allow the owner to distribute tokens', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await expect(
      GovernanceToken.connect(addr1).tokenDistribution(
        stakeholders,
        percentages,
        1000000,
      ),
    ).to.be.rejectedWith('permission: only Owner')
  })

  it('should not allow a user to vote outside the voting period', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      100,
    )
    await GovernanceToken.connect(addr1).createProposal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      1,
    )

    // Wait for the voting period to end
    await ethers.provider.send('evm_increaseTime', [2])
    await ethers.provider.send('evm_mine', [])

    await expect(
      GovernanceToken.connect(addr1).vote(1, true),
    ).to.be.revertedWith('Voting period has ended')
  })

  it('should not allow a user without tokens to vote', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      100,
    )
    await GovernanceToken.connect(addr1).createProposal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      3600,
    )

    await expect(
      GovernanceToken.connect(addr4).vote(1, true),
    ).to.be.rejectedWith('You do not have any tokens to vote with')
  })

  it('creates a proposal and allows voting', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      100,
    )
    await GovernanceToken.connect(addr1).createProposal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      3600,
    )

    const proposal = await GovernanceToken.proposals(1)
    expect(proposal.id).to.equal(1)
    expect(proposal.snapshoturl).to.equal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
    )
    expect(proposal.voteCountYes).to.equal(0)
    expect(proposal.voteCountNo).to.equal(0)
    expect(proposal.endTime).to.be.closeTo(proposal.startTime.add(3600), 1)

    await GovernanceToken.connect(addr1).vote(1, true)
    await GovernanceToken.connect(addr2).vote(1, false)
    await GovernanceToken.connect(addr3).vote(1, true)

    const updatedProposal = await GovernanceToken.proposals(1)
    expect(updatedProposal.voteCountYes).to.equal(70)
    expect(updatedProposal.voteCountNo).to.equal(30)
  })

  it('creates a proposal and allows voting', async () => {
    const stakeholders = [
      addr1Address,
      addr2Address,
      addr3Address,
      addr4Address,
    ]
    const percentages = [40, 30, 30, 0]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      10000,
    )
    await expect(
      GovernanceToken.connect(addr1).createProposal(
        'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
        3600,
      ),
    )
      .to.emit(GovernanceToken, 'NewGovernanceProposal')
      .withArgs(
        1,
        'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      )

    const proposal = await GovernanceToken.proposals(1)
    expect(proposal.id).to.equal(1)
    expect(proposal.snapshoturl).to.equal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
    )
    expect(proposal.voteCountYes).to.equal(0)
    expect(proposal.voteCountNo).to.equal(0)
    expect(proposal.endTime).to.be.closeTo(proposal.startTime.add(3600), 1)

    await expect(GovernanceToken.connect(addr1).vote(1, true))
      .to.emit(GovernanceToken, 'GovernanceVote')
      .withArgs(addr1Address, 1, 4000, 0)

    await expect(GovernanceToken.connect(addr2).vote(1, false))
      .to.emit(GovernanceToken, 'GovernanceVote')
      .withArgs(addr2Address, 1, 4000, 3000)

    await expect(GovernanceToken.connect(addr3).vote(1, true))
      .to.emit(GovernanceToken, 'GovernanceVote')
      .withArgs(addr3Address, 1, 7000, 3000)

    const updatedProposal = await GovernanceToken.proposals(1)
    expect(updatedProposal.voteCountYes).to.equal(7000)
    expect(updatedProposal.voteCountNo).to.equal(3000)
  })

  it('should not allow a user to vote twice on the same proposal', async () => {
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]

    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      100,
    )
    await GovernanceToken.connect(addr1).createProposal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      3600,
    )

    const proposal = await GovernanceToken.proposals(1)
    expect(proposal.id).to.equal(1)
    expect(proposal.snapshoturl).to.equal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
    )
    expect(proposal.voteCountYes).to.equal(0)
    expect(proposal.voteCountNo).to.equal(0)
    expect(proposal.endTime).to.be.closeTo(proposal.startTime.add(3600), 1)
    // Vote on a proposal
    await GovernanceToken.connect(addr2).vote(1, true)
    // Try to vote again on the same proposal
    await expect(
      GovernanceToken.connect(addr2).vote(1, false),
    ).to.be.rejectedWith('You have already voted on this proposal')
  })

  it('performs a complete functional test', async () => {
    // Token distribution
    const stakeholders = [addr1Address, addr2Address, addr3Address]
    const percentages = [40, 30, 30]
    await GovernanceToken.connect(owner).tokenDistribution(
      stakeholders,
      percentages,
      1000000,
    )

    // Create a proposal
    await GovernanceToken.connect(addr1).createProposal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
      3600,
    )

    // Check proposal details
    const proposal = await GovernanceToken.proposals(1)
    expect(proposal.id).to.equal(1)
    expect(proposal.snapshoturl).to.equal(
      'bafkreigls3zh24jb6yrcpfrg7x2arlg3mqjr4mf4pmsw3rs7ivge5rukwq',
    )
    expect(proposal.voteCountYes).to.equal(0)
    expect(proposal.voteCountNo).to.equal(0)
    expect(proposal.endTime).to.be.closeTo(proposal.startTime.add(3600), 1)

    // Vote on the proposal
    await GovernanceToken.connect(addr1).vote(1, true)
    await GovernanceToken.connect(addr2).vote(1, false)
    await GovernanceToken.connect(addr3).vote(1, true)

    // Check updated proposal details
    const updatedProposal = await GovernanceToken.proposals(1)
    expect(updatedProposal.voteCountYes).to.equal(700000)
    expect(updatedProposal.voteCountNo).to.equal(300000)

    // Update the proposal
    await GovernanceToken.connect(owner).updateProposal(
      1,
      'new_snapshot_url',
      7200,
    )

    // Check updated proposal details after the update
    const updatedProposalAfterUpdate = await GovernanceToken.proposals(1)
    expect(updatedProposalAfterUpdate.snapshoturl).to.equal('new_snapshot_url')
    expect(updatedProposalAfterUpdate.endTime).to.be.closeTo(
      updatedProposalAfterUpdate.startTime.add(7200),
      5,
    )
  })
})
