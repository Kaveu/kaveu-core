import { config } from "dotenv";
config();
import { reef } from "hardhat";

const CID = process.env["CID"];

async function main() {
  const signer = await reef.getSignerByName("account1");
  const kaveuERC1155 = await reef.getContractFactory("kaveuERC1155", signer);
  const address = await signer.getAddress();
  console.log("Ready to deploy by", address);
  const kaveu = await kaveuERC1155.deploy("36000", address, "ipfs://" + CID + "/");
  console.log("kaveuERC1155 deployed to:", (await kaveu.deployed()).address);
  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
