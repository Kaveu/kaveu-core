import { config } from "dotenv";
config();
import { reef } from "hardhat";
import { utils } from "ethers";

const uri_ = "ipfs://" + process.env["CID"] + "/";

async function main() {
  const signer1 = await reef.getSignerByName("account1");
  const signer2 = await reef.getSignerByName("account2");
  const KaveuERC721 = await reef.getContractFactory("KaveuERC721", signer1);
  const address1 = await signer1.getAddress();
  const address2 = await signer2.getAddress();
  console.log("Ready to deploy by", address1);
  const kaveu = await KaveuERC721.deploy(utils.parseEther("3"), address2, uri_);
  const kaveuAddress = (await kaveu.deployed()).address;
  console.log("KaveuERC721 deployed to:", kaveuAddress);

  // reef.verifyContract(kaveuAddress, "KaveuERC721");

  process.exit();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
