import { ethers } from "hardhat";

const main = async () => {
  const kaveu = await ethers.getContractAt("KaveuERC721", "0x3c42b33DF0CFF9875127E52584cE0a417f2f53ce", (await ethers.getSigners())[0]);
  console.log(kaveu.functions);
  
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
