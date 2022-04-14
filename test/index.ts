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

  this.timeout(80 * 10 ** 3);

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
    kaveu = await ethers.getContractAt("KaveuERC721", "0x301aD03dcac22310f9458f7e5E2AF7C7a6ee618B", sgn1);
    kaveu2 = await ethers.getContractAt("KaveuERC721", kaveu.address, sgn2);
  });

  let tx: TransactionResponse;

  describe("already tests & works together", async () => {
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

      tx = await kaveu.setUri("reef://test/");
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

      tx = await kaveu2.increaseClaws(2, incBy_, { value: requireAmount });
      await tx.wait(2);
      clawsOf2 = await kaveu.clawsOf(2);
      expect(clawsOf2).to.have.property("totalClaw").to.equal(nextTotalClaw);
      expect(clawsOf2).to.have.property("priceClaw").to.equal(nextPriceClaw);
    });

    it("airdrop", async () => {
      await expect(kaveu2.airdrop()).to.be.revertedWith("Ownable: caller is not the owner");

      const clawsOf2: Claw = await kaveu.clawsOf(2);
      const clawsOf5: Claw = await kaveu.clawsOf(5);

      const airdropReached: boolean = await kaveu.airdropReached();

      if (airdropReached) {
        await expect(kaveu.airdrop()).to.be.revertedWith("KaveuERC721: unable to make an airdrop");
      } else {
        tx = await kaveu.airdrop();
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
      }
    });

    it("withdraw", async () => {
      let balanceOfSigner: BigNumber = await sgn2.getBalance();
      let balanceOfKaveu: BigNumber = await kaveu.balance();

      await expect(kaveu2.withdraw()).to.be.revertedWith("Ownable: caller is not the owner");

      if (balanceOfKaveu.gt(BigNumber.from("0"))) {
        tx = await kaveu.withdraw();
        await tx.wait(2);

        expect(await sgn2.getBalance()).to.gt(balanceOfSigner);
        expect(await kaveu.balance()).to.equal(0);

        balanceOfKaveu = await kaveu.balance();
        balanceOfSigner = await sgn2.getBalance();
      }
    });
  });
  let wallets: Array<Wallet> = [];

  const generateWallets = (length: number) => {
    if (length == 0) throw new Error("generate wallets 0");
    // don't use the following words in prod
    for (let index = 0; index < length; index++) wallets[index] = Wallet.fromMnemonic("announce room limb pattern dry unit scale effort smooth jazz weasel alcohol", `m/44'/60'/0'/0/${index}`);
  };

  const fn_assign = async (start_id?: number, quantity?: number) => {
    const id = start_id || 2;
    const forClaw = quantity || 1;
    if (id < 2 || id > 5) return;

    const clawsOfId: Claw = await kaveu.clawsOf(id);

    // it can use clawsOf(id) but it want to expect borrowOf(id)
    const borrowDatas: Array<BorrowData> = await kaveu.borrowOf(id);
    let totalAssign = BigNumber.from(0);
    for await (const data of borrowDatas) totalAssign.add(data.totalBorrow);

    expect(totalAssign).to.equal(clawsOfId.totalAssign);

    if (totalAssign.add(BigNumber.from(forClaw)).lte(clawsOfId.totalClaw)) {
      tx = await kaveu2.assign(id, forClaw, wallets[id - 2].address); // assign 1 claw
      await tx.wait(2);
    } else await expect(kaveu2.assign(id, forClaw, wallets[id - 2].address)).to.be.revertedWith("KaveuERC721: cannot assign the borrower");

    await fn_assign(id + 1, forClaw);
  };

  const fn_deassign = async (start_id?: number, quantity?: number) => {
    const id = start_id || 2;
    const forClaw = quantity || 1;
    if (id < 2 || id > 5) return;

    const borrowerTarget = wallets[id - 2].address;
    const borrowDatas: Array<BorrowData> = await kaveu.borrowOf(id);

    const data = borrowDatas.find((data) => data.borrower == borrowerTarget);

    if (typeof data === "undefined") await expect(kaveu2.deassign(id, forClaw, borrowerTarget)).to.be.reverted;
    else {
      tx = await kaveu2.deassign(id, data.totalBorrow, borrowerTarget); // deassign 1 claw
      await tx.wait(2);
    }

    await fn_deassign(id + 1, forClaw);
  };

  describe.skip("Assignable section", async () => {
    it("generate wallet", () => {
      generateWallets(100);
    });

    it("assign & borrowOf", async () => {
      const { totalClaw: totalClawOf5 }: Claw = await kaveu.clawsOf(5);
      // function assign(uint256 _tokenId, uint256 _forClaw, address _borrower) external onlyOwnerOf(_tokenId)
      await expect(kaveu.assign(5, totalClawOf5.sub(BigNumber.from(1)), sgn2.address)).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.assign(5, totalClawOf5.add(BigNumber.from(1)), sgn1.address)).to.be.revertedWith("KaveuERC721: cannot assign the borrower");

      await fn_assign(2);
    });

    it("deassign", async () => {
      await expect(kaveu.deassign(5, 1, sgn1.address)).to.be.revertedWith("KaveuERC721: you are not the owner");
      await expect(kaveu2.deassign(5, 1000, sgn1.address)).to.be.reverted;
      await fn_deassign(2);
    });
  });

  describe("Borrow section", async () => {
    const _pricePerDay = utils.parseUnits("1", "gwei");

    const fn_loan = async () => {
      await fn_loan();
    };

    it("generate wallet", () => {
      generateWallets(100);
    });

    it("loan on", async () => {
      await expect(kaveu.loan(3, _pricePerDay)).to.be.revertedWith("KaveuERC721: you are not the owner");
      tx = await kaveu2.loan(3, _pricePerDay);
      await tx.wait(2);
    });

    it("borrow", async () => {
      const clawsOf3: Claw = await kaveu.clawsOf(3);
      const _walts = wallets.slice(20, 20 + clawsOf3.totalClaw.toNumber());

      const borrowerTarget = _walts[0].address;

      // function borrow(uint256 _tokenId, uint256 _forClaws, uint256 _forDays, address _borrower) external payable existToken(_tokenId)
      await expect(kaveu.borrow(4, 0, 1, borrowerTarget)).to.be.revertedWith("KaveuERC721: cannot borrow"); // _pricePerDay 0
      await expect(kaveu.borrow(3, 0, 1, borrowerTarget)).to.be.revertedWith("KaveuERC721: cannot borrow"); // _forClaws 0
      await expect(kaveu.borrow(3, clawsOf3.totalClaw, 0, borrowerTarget)).to.be.revertedWith("KaveuERC721: cannot borrow"); // _forDays 0
      await expect(kaveu.borrow(3, clawsOf3.totalClaw, 2, borrowerTarget)).to.be.revertedWith("KaveuERC721: not enought token"); // payable 0

      const requireAmount = BigNumber.from(2) // 2 _forDays
        .mul(clawsOf3.totalClaw)
        .mul(clawsOf3.pricePerDay);

      tx = await kaveu.borrow(3, clawsOf3.totalClaw, 2, borrowerTarget, { value: requireAmount });
      await tx.wait(2);
    });

    it("loan off", async () => {
      tx = await kaveu2.loan(3, 0);
      await tx.wait(2);
    });
  });

  it("clean data", async () => {
    // because need to wait _forDays xD
    // 14/04/2022 13:10 txHash https://mumbai.polygonscan.com/tx/0xe8551c231d8e88a1c8ecbdb73a4364dc5b0e6a04a9e72aef6f73ad92dc9a529d
  
    try {
      
    } catch (error) {
      
    }
  
  });
});
