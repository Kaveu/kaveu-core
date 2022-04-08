// import { config } from "dotenv";
// config();
import { reef } from "hardhat";
// import { utils, Contract, BigNumber } from "ethers";
// import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";

// const uri_ = "ipfs://" + process.env["CID"] + "/";

async function main() {
  const [signer1, _signer2] = await reef.getSigners();
  const kaveu = await reef.getContractAt("KaveuERC721", "0x88DCF646cf43816A72C2Eb849B2594070a40006F", signer1);

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
