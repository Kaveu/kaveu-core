import { config } from "dotenv";
config();
import { ethers } from "hardhat";
import { utils } from "ethers";

const uri_ = "ipfs://" + process.env["CID"] + "/";
const priceClawsEther = utils.parseEther("0.001");

async function main() {
  const [sgn1, sgn2] = await ethers.getSigners();

  // deploy new contract
  console.log("KaveuERC721 ready to deploy by", sgn1.address);
  const KaveuERC721 = await ethers.getContractFactory("KaveuERC721", sgn1);
  let kaveu = await KaveuERC721.deploy(priceClawsEther, sgn2.address, uri_);
  kaveu = await kaveu.deployed();
  console.log("KaveuERC721 deployed to", kaveu.address);

  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
