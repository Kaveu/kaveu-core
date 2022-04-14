import { BorrowData } from "./../utils/types.d";
import { ethers } from "hardhat";

const main = async () => {
  const kaveu = await ethers.getContractAt("KaveuERC721", "0x3c42b33DF0CFF9875127E52584cE0a417f2f53ce", (await ethers.getSigners())[0]);
  const borrowDatas: Array<BorrowData> = await kaveu.borrowOf(5);
  console.log(borrowDatas);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
