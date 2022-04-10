import { config } from "dotenv";
config();
import { expect, use } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { utils, Contract, BigNumber } from "ethers";
import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";

const uri_ = "ipfs://" + process.env["CID"] + "/";

use(solidity);

describe("Test Contract KaveuERC721", function () {
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let addr1: string;
  let addr2: string;
  let kaveu: Contract;
  let kaveu2: Contract;
  let reef20: Contract;

  this.timeout(100 * 10 ** 3);

  before(async () => {
    [signer1, signer2] = await ethers.getSigners();
    addr1 = signer1.address;
    addr2 = signer2.address;

    
    // deploy
    // const KaveuERC721 = await ethers.getContractFactory("KaveuERC721", signer1);
    // const address2 = await signer2.getAddress();
    // kaveu = await KaveuERC721.deploy(utils.parseEther("3"), address2, uri_);
    // kaveu = await kaveu.deployed();

    // or that
    kaveu = await ethers.getContractAt("KaveuERC721", "0xb257626a6C95a6540eDdeE822f78fEd2CD5A455a", signer1);

    // leave me
    kaveu2 = await ethers.getContractAt("KaveuERC721", kaveu.address, signer2);
    // signer1.getBalance("latest")
    reef20 = await ethers.getContractAt("IERC20", "0x0000000000000000000000000000000001000000", signer1);
  });

  // it("name, symbol & priceClaws", async () => {
  //   expect(await kaveu.name()).to.equal("Kaveu");
  //   expect(await kaveu.symbol()).to.equal("KVU");

  //   expect(await kaveu.priceClaws()).to.equal(utils.parseEther("3"));
  // });

  // it("clawsOf", async () => {
  //   // the id start at 1 and the MAX_SUPPLY is equal to 34
  //   expect(await kaveu.clawsOf(1)).to.equal(721);
  //   expect(await kaveu.clawsOf(2)).to.equal(2);
  //   expect(await kaveu.clawsOf(34)).to.equal(2);

  //   await expect(kaveu.clawsOf(0)).to.be.revertedWith("KaveuERC721: the token does not exist");
  //   await expect(kaveu.clawsOf(35)).to.be.revertedWith("KaveuERC721: the token does not exist");
  // });

  // it("tokenURI", async () => {
  //   // baseURI is uri_
  //   expect(await kaveu.tokenURI(1)).to.equal(uri_ + "1.json");
  //   expect(await kaveu.tokenURI(34)).to.equal(uri_ + "34.json");
  // });

  // it("setUri", async () => {
  //   // baseURI is uri_
  //   await expect(kaveu2.setUri("test")).to.be.revertedWith("Ownable: caller is not the owner");

  //   let tx: TransactionResponse = await kaveu.setUri("reef://test/");
  //   await tx.wait(2);
  //   expect(await kaveu.tokenURI(1)).to.equal("reef://test/1.json");
  //   tx = await kaveu.setUri(uri_);
  //   await tx.wait(2);
  //   expect(await kaveu.tokenURI(8)).to.equal(uri_ + "8.json");
  // });

  // it("setPriceClaws", async () => {
  //   await expect(kaveu2.setPriceClaws(utils.parseEther("10"))).to.be.revertedWith("Ownable: caller is not the owner");

  //   let tx: TransactionResponse = await kaveu.setPriceClaws(utils.parseEther("10"));
  //   await tx.wait(2);
  //   expect(await kaveu.priceClaws()).to.equal(utils.parseEther("10"));
  //   tx = await kaveu.setPriceClaws(utils.parseEther("3"));
  //   await tx.wait(2);
  //   expect(await kaveu.priceClaws()).to.equal(utils.parseEther("3"));
  // });

  // it("airdrop", async () => {
  //   await expect(kaveu2.airdrop()).to.be.revertedWith("Ownable: caller is not the owner");

  //   let tx: TransactionResponse = await kaveu.airdrop();
  //   await tx.wait(2);
  //   expect(await kaveu.clawsOf(1)).to.equal(721);
  //   expect(await kaveu.clawsOf(2)).to.equal(2 + (7 - 2 - 1));
  //   expect(await kaveu.clawsOf(34)).to.equal(2 + (7 - 2 - 1));
  // });

  describe("increase & withdraw", async () => {
    it("increaseClaws", async () => {
      const priceClaws: BigNumber = await kaveu.priceClaws();
      const incBy_ = BigNumber.from(2);
      const totalCost = priceClaws.mul(incBy_);
      const clawsOf2: BigNumber = await kaveu.clawsOf(2);

      await expect(kaveu.increaseClaws(2, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.increaseClaws(1, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: unable to increase the token");

      let tx: TransactionResponse = await kaveu2.increaseClaws(2, incBy_, { value: totalCost });
      await tx.wait(2);
      expect(await kaveu.clawsOf(2)).to.equal(incBy_.add(clawsOf2));
    });

    it("withdraw", async () => {
      let balanceOfSigner: BigNumber = await reef20.balanceOf(addr2);
      let balanceOfKaveu: BigNumber = await kaveu.balance();

      await expect(kaveu2.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
      let tx: TransactionResponse = await kaveu.withdraw();
      await tx.wait(2);
      expect(await reef20.balanceOf(addr2)).to.gt(balanceOfSigner);
      console.log("before", balanceOfKaveu.toString(), balanceOfSigner.toString());
      balanceOfKaveu = await kaveu.balance();
      balanceOfSigner = await reef20.balanceOf(addr2);
      console.log("after", balanceOfKaveu.toString(), balanceOfSigner.toString());
    });
  });
});
