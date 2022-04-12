import { config } from "dotenv";
config();
import { ethers } from "hardhat";
import { utils } from "ethers";

const uri_ = "ipfs://" + process.env["CID"] + "/";
const priceClawsEther = utils.parseEther("0.001");

// sgn2 = 0x8aab67ec7De4bCb41dc67Cfd9CDf3d0267933b61

async function main() {
  const [sgn1, sgn2] = await ethers.getSigners();

  // deploy new contract
  console.log("KaveuERC721 ready to deploy by", sgn1.address);
  const KaveuERC721 = await ethers.getContractFactory("KaveuERC721", sgn1);
  let kaveu = await KaveuERC721.deploy(priceClawsEther, sgn2.address, uri_);
  kaveu = await kaveu.deployed();
  console.log("KaveuERC721 deployed to", kaveu.address);

  // run to verify
  // yarn hardhat verify [kaveu.address] [utils.parseEther("0.001")] "[sgn2.address]" "ipfs://[process.env.CID]/"

  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
