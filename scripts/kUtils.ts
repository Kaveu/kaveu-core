import { ethers } from "hardhat"

async function main() {
  const [sgn1] = await ethers.getSigners()

  const KaveuUtils = await ethers.getContractFactory("KaveuUtils", sgn1)
  let kUtils = await KaveuUtils.deploy("0xf46f27ca5D858103e7ad5D7dFd4556786010d2f8")
  kUtils = await kUtils.deployed()
  console.log("KaveuUtils deployed to", kUtils.address)
  process.exit()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
