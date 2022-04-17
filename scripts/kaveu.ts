import { ethers } from "hardhat";

const main = async () => {
  const kaveu = await ethers.getContractAt("KaveuERC721", "0xDfBbA66e0f974e223D65c4Ea86Fa876611997259", (await ethers.getSigners())[0]);
  console.log(kaveu.functions);
  
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
