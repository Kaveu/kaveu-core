// import { config } from "dotenv";
// config();
import { ethers } from "hardhat";
import { BigNumber, constants, utils } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";

// const uri_ = "ipfs://" + process.env["CID"] + "/";

async function main() {
  const [owner] = await ethers.getSigners();
  const kaveu = await ethers.getContractAt("KaveuERC721", "0x2C3DE317b7eaE4FBd128fF35beE75848fd594945", owner);

  const totalSupply: BigNumber = await kaveu.MAX_SUPPLY();
  let tx: TransactionResponse;

  for (let tokenId = 1; tokenId <= totalSupply.toNumber(); tokenId++) {
    tx = await kaveu.transferFrom(owner.address, constants.AddressZero, tokenId, {
      // gasPrice: utils.parseUnits("22", "gwei"),
      gasLimit: 22 * 10 ** 4,
    });
    console.log("wait transferFrom", tokenId);
    await tx.wait(2);
  }

  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
