// import { config } from "dotenv";
// config();
import { ethers } from "hardhat";
// import { utils, Contract, BigNumber } from "ethers";
// import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";

// const uri_ = "ipfs://" + process.env["CID"] + "/";

async function main() {
  const [signer1] = await ethers.getSigners();
  const kaveu = await ethers.getContractAt("KaveuERC721", "0xD9cb97E7510C959cf5a589DA0E55b45EDb50f553", signer1);

  const test = await kaveu.test();
  console.log("test", test);
  const clawLoans = await kaveu.clawLoans();
  console.log("clawLoans", clawLoans);
  const borrowOf = await kaveu.borrowOf(2);
  console.log("borrowOf", borrowOf);

  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
