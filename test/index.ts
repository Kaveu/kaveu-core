import { config } from "dotenv";
config();
import { expect, use } from "chai";
import { reef } from "hardhat";
import { solidity } from "ethereum-waffle";
import { ProxySigner } from "@reef-defi/hardhat-reef/src/proxies/signers/ProxySigner";
import { utils, Contract, BigNumber } from "ethers";
import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";

const uri_ = "ipfs://" + process.env["CID"] + "/";

use(solidity);

describe("Test Contract KaveuERC721", function () {
  let signer1: ProxySigner;
  let signer2: ProxySigner;
  let kaveu: Contract;
  let kaveu2: Contract;
  let reef20: Contract;

  this.timeout(100 * 10 ** 3);

  before(async () => {
    [signer1, signer2] = await reef.getSigners();

    // deploy
    // const KaveuERC721 = await reef.getContractFactory("KaveuERC721", signer1);
    // const address2 = await signer2.getAddress();
    // kaveu = await KaveuERC721.deploy(utils.parseEther("3"), address2, uri_);
    // kaveu = await kaveu.deployed();

    kaveu = await reef.getContractAt("KaveuERC721", "0xA13ac3411CFb490E5B3026a1C8ce8a573d62d1EE", signer1);
    kaveu2 = await reef.getContractAt("KaveuERC721", kaveu.address, signer2);
    reef20 = await reef.getContractAt("IERC20", "0x0000000000000000000000000000000001000000", signer1);
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

  // it("increaseClaws", async () => {
  //   const priceClaws: BigNumber = await kaveu.priceClaws();
  //   const incBy_ = BigNumber.from(2);
  //   const totalCost = priceClaws.mul(incBy_);
  //   const clawsOf2: BigNumber = await kaveu.clawsOf(2);

  //   await expect(kaveu.increaseClaws(2, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: you are not the owner");
  //   await expect(kaveu2.increaseClaws(1, incBy_, { value: totalCost })).to.be.revertedWith("KaveuERC721: unable to increase the token");

  //   let tx: TransactionResponse = await kaveu2.increaseClaws(2, incBy_, { value: totalCost });
  //   await tx.wait(2);
  //   expect(await kaveu.clawsOf(2)).to.equal(incBy_.add(clawsOf2));
  // });

  it("withdraw", async () => {
    const addr = await signer2.getAddress();
    let balanceOfSigner: BigNumber = await reef20.balanceOf(addr);
    let balanceOfKaveu: BigNumber = await kaveu.balance();

    console.log(balanceOfKaveu);
    console.log(balanceOfKaveu.toString());
    

    // await expect(kaveu2.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
    // let tx: TransactionResponse = await kaveu.withdraw();
    // await tx.wait(2);
    // // expect(await reef20.balanceOf(addr)).to.equal(balanceOfSigner.add(balanceOf));
    // console.log("before", balanceOfKaveu.toString(), balanceOfSigner.toString());
    // balanceOfKaveu = await kaveu.balance();
    // balanceOfSigner = await reef20.balanceOf(addr);
    // console.log("after", balanceOfKaveu.toString(), balanceOfSigner.toString());
  });
});
