import { config } from "dotenv";
config();
import { reef } from "hardhat";

const CID = process.env["CID"];

async function main() {
  const signer = await reef.getSignerByName("account1");
  const TorumoniERC1155 = await reef.getContractFactory("TorumoniERC1155", signer);
  console.log("Ready to deploy by", await signer.getAddress());
  const toru = await TorumoniERC1155.deploy("ipfs://" + CID + "/");
  console.log("TorumoniERC1155 deployed to:", (await toru.deployed()).address);
  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
