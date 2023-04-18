import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";

describe("GovernanceTokenFactory", () => {
  let owner: Signer;
  let tokengenerator: Signer;
  let factory: Contract;
  let GovernanceToken: any;

  beforeEach(async () => {
    [owner, tokengenerator] = await ethers.getSigners();

    const GovernanceTokenFactory = await ethers.getContractFactory("GovernanceTokenFactory");
    factory = await GovernanceTokenFactory.deploy();
    await factory.deployed();

    await factory.settokengenerator(await tokengenerator.getAddress());

    const GovernanceTokenArtifact = await ethers.getContractFactory("GovernanceToken");
    GovernanceToken = GovernanceTokenArtifact;
  });

  it("Should emit TokenCreated event", async () => {
    const name = "TestToken";
    const symbol = "TST";
    const totalSupply = ethers.utils.parseEther("1000");

    await expect(factory.connect(tokengenerator).createToken(name, symbol, totalSupply))
      .to.emit(factory, "TokenCreated")
      .withArgs(
        ethers.utils.hexZeroPad(ethers.constants.AddressZero, 20), // The actual address will be different every time
        await tokengenerator.getAddress()
      );
  });

  it("Should create a new GovernanceToken", async () => {
    const name = "TestToken";
    const symbol = "TST";
    const totalSupply = ethers.utils.parseEther("1000");

    const tx = await factory.connect(tokengenerator).createToken(name, symbol, totalSupply);
    const receipt = await tx.wait();
    const event = receipt.events?.filter((x: any) => x.event === "TokenCreated")[0];
    const newTokenAddress = event.args[0];
    const newToken = new ethers.Contract(newTokenAddress, GovernanceToken.interface, tokengenerator);

    expect(await newToken.name()).to.equal(name);
    expect(await newToken.symbol()).to.equal(symbol);
    expect(await newToken.totalSupply()).to.equal(totalSupply);
    expect(await newToken.balanceOf(await tokengenerator.getAddress())).to.equal(totalSupply);
  });

  it("Should not allow non-tokengenerator to create tokens", async () => {
    const name = "TestToken";
    const symbol = "TST";
    const totalSupply = ethers.utils.parseEther("1000");

    await expect(factory.createToken(name, symbol, totalSupply)).to.be.revertedWith("permission: only Factory");
  });
});
