import { config } from "dotenv";
config();
import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils, Contract, BigNumber, Wallet } from "ethers";
import { Claw, BorrowData } from "./../utils/types.d";
import { TransactionResponse } from "@ethersproject/abstract-provider";

const uri_ = "ipfs://" + process.env["CID"] + "/";

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
    // kaveu = await KaveuERC721.deploy(sgn2.address, uri_);
    // kaveu = await kaveu.deployed();
    // console.log("KaveuERC721 deployed to", kaveu.address);
    // console.log("The owner tokens is", sgn2.address);

    // or use the already deployed contract
    kaveu = await ethers.getContractAt("KaveuERC721", "0xd8f88B947E94A0702f1f2a4EAbfb2F8344221d15", sgn1);
    kaveu2 = await ethers.getContractAt("KaveuERC721", kaveu.address, sgn2);
  });

  describe.skip("already testing", async () => {
    it("name", async () => {
      expect(await kaveu.name()).to.equal("Kaveu");
    });
    it("symbol", async () => {
      expect(await kaveu.symbol()).to.equal("KVU");
    });

    it("clawsOf", async () => {
      expect(await kaveu.clawsOf(1))
        .to.have.property("totalClaw")
        .to.equal(721);
      expect(await kaveu.clawsOf(2))
        .to.have.property("totalClaw")
        .to.gte(BigNumber.from(2));
      expect(await kaveu.clawsOf(5))
        .to.have.property("totalClaw")
        .to.gte(2);

      await expect(kaveu.clawsOf(0)).to.be.revertedWith("KaveuERC721: the token does not exist");
      await expect(kaveu.clawsOf(35)).to.be.revertedWith("KaveuERC721: the token does not exist");
    });

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

    it("increaseClaws", async () => {
      let clawsOf2: Claw = await kaveu.clawsOf(2);
      const incBy_ = BigNumber.from("2");
      const requireAmount = clawsOf2.priceClaw.mul(incBy_);
      const nextTotalClaw = incBy_.add(clawsOf2.totalClaw);
      const nextPriceClaw = nextTotalClaw.mul(utils.parseUnits("138696.25", "gwei"));

      await expect(kaveu.increaseClaws(2, incBy_, { value: requireAmount })).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.increaseClaws(1, incBy_, { value: requireAmount })).to.be.revertedWith("KaveuERC721: unable to increase the token");

      let tx: TransactionResponse = await kaveu2.increaseClaws(2, incBy_, { value: requireAmount });
      await tx.wait(2);
      clawsOf2 = await kaveu.clawsOf(2);
      expect(clawsOf2).to.have.property("totalClaw").to.equal(nextTotalClaw);
      expect(clawsOf2).to.have.property("priceClaw").to.equal(nextPriceClaw);
    });

    it("airdrop", async () => {
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
        .to.gt(clawsOf2.totalClaw);
      const airdropFor = 7 - 2 - 1;
      expect(await kaveu.clawsOf(5))
        .to.have.property("totalClaw")
        .to.equal(clawsOf5.totalClaw.add(BigNumber.from(airdropFor)));
    });

    it("withdraw", async () => {
      let balanceOfSigner: BigNumber = await sgn2.getBalance();
      let balanceOfKaveu: BigNumber = await kaveu.balance();
      console.log("before", balanceOfKaveu.toString(), balanceOfSigner.toString());

      await expect(kaveu2.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");

      if (balanceOfKaveu.gt(BigNumber.from("0"))) {
        let tx: TransactionResponse = await kaveu.withdraw();
        await tx.wait(2);

        expect(await sgn2.getBalance()).to.gt(balanceOfSigner);
        expect(await kaveu.balance()).to.equal(0);

        balanceOfKaveu = await kaveu.balance();
        balanceOfSigner = await sgn2.getBalance();
        console.log("after", balanceOfKaveu.toString(), balanceOfSigner.toString());
      }
    });
  });

  /////////////////////////////////////////////////////////////////////
  /////////////////////////// LOAN ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  describe("loan section", async () => {
    const wallets = new Array<Wallet>(4);
    for (let index = 0; index < wallets.length; index++) wallets[index] = Wallet.fromMnemonic("announce room limb pattern dry unit scale effort smooth jazz weasel alcohol", `m/44'/60'/0'/0/${index}`);

    let tx: TransactionResponse;

    const fn_assign = async (start_id?: number, quantity?: number) => {
      const id = start_id || 2;
      const forClaw = quantity || 1;
      if (id < 2 || id > 5) return;
      tx = await kaveu2.assign(id, forClaw, wallets[id - 2].address); // assign 1 claw
      await tx.wait(2);

      await fn_assign(id + 1, forClaw);
    };

    const fn_deassign = async (start_id?: number, quantity?: number) => {
      const id = start_id || 2;
      const forClaw = quantity || 1;
      if (id < 2 || id > 5) return;
      tx = await kaveu2.deassign(id, forClaw, wallets[id - 2].address); // assign 1 claw
      await tx.wait(2);

      await fn_deassign(id + 1, forClaw);
    };

    this.timeout(100 * 10 ** 3);

    it("assign", async () => {
      const { totalClaw: totalClawOf5 }: Claw = await kaveu.clawsOf(5);
      // function assign(uint256 _tokenId, uint256 _forClaw, address _borrower) external onlyOwnerOf(_tokenId)
      await expect(kaveu.assign(5, totalClawOf5.sub(BigNumber.from(1)), sgn2.address)).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.assign(5, totalClawOf5.add(BigNumber.from(1)), sgn1.address)).to.be.revertedWith("KaveuERC721: cannot assign the borrower");
      await fn_assign(2);
    });

    // it("borrowOf", async () => {
    //   const borrowDataPromises: Array<Promise<Array<BorrowData>>> = [kaveu2.borrowOf(2), kaveu2.borrowOf(3), kaveu2.borrowOf(4), kaveu2.borrowOf(5)];

    //   let i = 0;
    //   for await (const data of borrowDataPromises) {
    //     data.some((d) => d.borrower == wallets[i].address);
    //     expect("");
    //   }
    // });

    it("deassign", async () => {
      await expect(kaveu2.deassign(5, 1, sgn1.address)).to.be.revertedWith("KaveuERC721: cannot deassign the borrower");
      // await expect(kaveu2.deassign(5, 721, sgn1.address)).to.be.revertedWith("");
      await fn_deassign(2);
    });
  });
});
