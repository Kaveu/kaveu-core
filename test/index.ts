import { config } from "dotenv";
config();
import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils, Contract, BigNumber } from "ethers";
import { Claw } from "./../utils/types.d";
import { TransactionResponse } from "@ethersproject/abstract-provider";

const uri_ = "ipfs://" + process.env["CID"] + "/";
const priceClawsEther = utils.parseEther("0.001");

use(solidity);

describe("Test Contract KaveuERC721", function () {
  let sgn1: SignerWithAddress;
  let sgn2: SignerWithAddress;
  let kaveu: Contract;
  let kaveu2: Contract;

  this.timeout(100 * 10 ** 3);

  before(async () => {
    [sgn1, sgn2] = await ethers.getSigners(); // or use deployed contract

    // deploy section
    // console.log("KaveuERC721 ready to deploy by", sgn1.address);
    // const KaveuERC721 = await ethers.getContractFactory("KaveuERC721", sgn1);
    // kaveu = await KaveuERC721.deploy(priceClawsEther, sgn2.address, uri_);
    // kaveu = await kaveu.deployed();
    // console.log("KaveuERC721 deployed to", kaveu.address);

    // or use the already deployed contract
    kaveu = await ethers.getContractAt("KaveuERC721", "0xa51Cc2A999048F0725986519A72dA412Eb80e04c", sgn1);
    kaveu2 = await ethers.getContractAt("KaveuERC721", kaveu.address, sgn2);
  });

  describe("name, symbol & priceClaws", async () => {
    it("name", async () => {
      expect(await kaveu.name()).to.equal("Kaveu");
    });
    it("symbol", async () => {
      expect(await kaveu.symbol()).to.equal("KVU");
    });
    it("priceClaws", async () => {
      expect(await kaveu.priceClaws()).to.equal(priceClawsEther);
    });
  });

  it("clawsOf", async () => {
    // the id start at 1 and the MAX_SUPPLY is equal to 5
    expect(await kaveu.clawsOf(1))
      .to.have.property("totalClaw")
      .to.equal(721);
    expect(await kaveu.clawsOf(2))
      .to.have.property("totalClaw")
      .to.equal(2);
    expect(await kaveu.clawsOf(5))
      .to.have.property("totalClaw")
      .to.equal(2);

    await expect(kaveu.clawsOf(0)).to.be.revertedWith("KaveuERC721: the token does not exist");
    await expect(kaveu.clawsOf(35)).to.be.revertedWith("KaveuERC721: the token does not exist");
  });

  describe("tokenURI & setUri", async () => {
    it("tokenURI", async () => {
      // baseURI is uri_
      expect(await kaveu.tokenURI(1)).to.equal(uri_ + "1.json");
      expect(await kaveu.tokenURI(5)).to.equal(uri_ + "5.json");
    });

    it("setUri", async () => {
      // baseURI is uri_
      await expect(kaveu2.setUri("test")).to.be.revertedWith("Ownable: caller is not the owner");

      let tx: TransactionResponse = await kaveu.setUri("reef://test/");
      await tx.wait(2);
      expect(await kaveu.tokenURI(1)).to.equal("reef://test/1.json");
      tx = await kaveu.setUri(uri_);
      await tx.wait(2);
      expect(await kaveu.tokenURI(5)).to.equal(uri_ + "5.json");
    });
  });

  it("setPriceClaws", async () => {
    await expect(kaveu2.setPriceClaws(utils.parseEther("10"))).to.be.revertedWith("Ownable: caller is not the owner");

    let tx: TransactionResponse = await kaveu.setPriceClaws(utils.parseEther("10"));
    await tx.wait(2);
    expect(await kaveu.priceClaws()).to.equal(utils.parseEther("10"));
    tx = await kaveu.setPriceClaws(priceClawsEther);
    await tx.wait(2);
    expect(await kaveu.priceClaws()).to.equal(priceClawsEther);
  });

  it.skip("airdrop", async () => {
    await expect(kaveu2.airdrop()).to.be.revertedWith("Ownable: caller is not the owner");

    const clawsOf2: Claw = await kaveu.clawsOf(2);
    const clawsOf5: Claw = await kaveu.clawsOf(5);

    let tx: TransactionResponse = await kaveu.airdrop();
    await tx.wait(2);
    expect(await kaveu.clawsOf(1))
      .to.have.property("totalClaw")
      .to.equal(721);
    expect(await kaveu.clawsOf(2))
      .to.have.property("totalClaw")
      .to.gt(clawsOf2.totalClaw.toNumber());
    const airdropFor = 7 - 2 - 1;
    expect(await kaveu.clawsOf(5))
      .to.have.property("totalClaw")
      .to.equal(clawsOf5.totalClaw.add(BigNumber.from(airdropFor)).toNumber());
  });

  describe.skip("increase & withdraw", async () => {
    it.skip("increaseClaws", async () => {
      const priceClaws: BigNumber = await kaveu.priceClaws();
      const incBy_ = BigNumber.from(2);
      const totalCost = priceClaws.mul(incBy_);
      const clawsOf2: Claw = await kaveu.clawsOf(2);

      await expect(kaveu.increaseClaws(2, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.increaseClaws(1, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: unable to increase the token");

      let tx: TransactionResponse = await kaveu2.increaseClaws(2, incBy_, { value: totalCost });
      await tx.wait(2);
      expect(await kaveu.clawsOf(2))
        .to.have.property("totalClaw")
        .to.equal(incBy_.add(clawsOf2.totalClaw));
    });

    it.skip("withdraw", async () => {
      let balanceOfSigner: BigNumber = await sgn2.getBalance();
      let balanceOfKaveu: BigNumber = await kaveu.balance();
      console.log("before", balanceOfKaveu.toString(), balanceOfSigner.toString());

      await expect(kaveu2.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
      let tx: TransactionResponse = await kaveu.withdraw();
      await tx.wait(2);
      expect(await sgn2.getBalance()).to.gt(balanceOfSigner);

      balanceOfKaveu = await kaveu.balance();
      balanceOfSigner = await sgn2.getBalance();
      console.log("after", balanceOfKaveu.toString(), balanceOfSigner.toString());
    });
  });

  /////////////////////////////////////////////////////////////////////
  /////////////////////////// LOAN ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  describe.skip("loan section", async () => {
    it.skip("claws", async () => {
      const totalSupply: BigNumber = await kaveu.totalSupply();
      const claws: Array<Claw> = await kaveu.claws();

      expect(claws).to.have.lengthOf(totalSupply.toNumber());
    });

    it.skip("assign & deassign", async () => {
      const clawsOf2: BigNumber = await kaveu.clawsOf(2);

      // function assign(uint256 _tokenId, uint256 _forClaw, address _borrower) external onlyOwnerOf(_tokenId)
      await expect(kaveu.assign(2, clawsOf2.sub(BigNumber.from(1)), sgn2.address)).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.assign(2, clawsOf2.add(BigNumber.from(1)), sgn1.address)).to.be.revertedWith("KaveuERC721: cannot assign the borrower");

      let tx: TransactionResponse;
      // let borrowOf: Array<BorrowData>;

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
      tx = await kaveu2.assign(2, 1, sgn1.address); // assign 1 claw
      await tx.wait(2);

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
      tx = await kaveu2.deassign(2, 1, sgn1.address);
      await tx.wait(2);

      ////////////////////////

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
      tx = await kaveu2.assign(2, 2, sgn1.address); // assign 2 claws
      await tx.wait(2);

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
      tx = await kaveu2.deassign(2, 1, sgn1.address);
      await tx.wait(2);

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
      tx = await kaveu2.deassign(2, 1, sgn1.address);
      await tx.wait(2);

      // borrowOf = await kaveu.borrowOf(2);
      // console.log(borrowOf);
    });

    it.skip("loan", async () => {
      const pricePerDay = utils.parseEther("0.01");
      const tokenId = 2;
      let claws: Array<Claw> = await kaveu.claws();
      console.log(claws[tokenId - 1]);

      // function loan(uint256 _tokenId, uint256 _pricePerDay) external onlyOwnerOf(_tokenId)
      await expect(kaveu.loan(tokenId, pricePerDay)).to.be.revertedWith("KaveuERC721: you are not the owner");

      let tx: TransactionResponse;

      tx = await kaveu2.loan(tokenId, pricePerDay);
      claws = await kaveu.claws();
      console.log(claws[tokenId - 1]);
    });
  });
});
