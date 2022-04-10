import { config } from "dotenv";
config();
import { ethers } from "hardhat";
import { utils } from "ethers";

const uri_ = "ipfs://" + process.env["CID"] + "/";

async function main() {
  const [signer1, signer2] = await ethers.getSigners();
  const KaveuERC721 = await ethers.getContractFactory("KaveuERC721", signer1);
  console.log("Ready to deploy by", signer1.address);

  const kaveu = await KaveuERC721.deploy(utils.parseEther("3"), signer2.address, uri_);
  const kaveuAddress = (await kaveu.deployed()).address;
  console.log("KaveuERC721 deployed to:", kaveuAddress);

  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
