import { config } from "dotenv";
config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const PK_MUMBAI_0 = process.env["PK_MUMBAI_0"] || "";
const PK_MUMBAI_1 = process.env["PK_MUMBAI_1"] || "";

const accounts = [PK_MUMBAI_0, PK_MUMBAI_1];

const mumbai = {
  chainId: 80001,
  url: process.env["HTTPS_MUMBAI"] || "",
  accounts,
};

const hreConfig: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "mumbai",
  networks: { mumbai },
};

export default hreConfig;

/* const seeds = {
  account1: process.env["MNEMONIC_SEED_TESTNET_1"] || "",
  account2: process.env["MNEMONIC_SEED_TESTNET_2"] || "",
};

const reef: ReefNetworkConfig = {
  url: "ws://localhost:9944",
  gas: "auto",
  seeds,
  gasPrice: "auto",
  gasMultiplier: 1,
  timeout: 10000,
  httpHeaders: {},
  accounts: "remote",
};

const reef_testnet: ReefNetworkConfig = {
  ...reef,
  url: "wss://rpc-testnet.reefscan.com/ws",
}; */

/* task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const [signer] = await hre.reef.getSigners();
  await signer.claimDefaultAccount();

  const bob = await hre.reef.getSignerByName("bob");
  console.log("bob", await bob.getAddress(), (await bob.getBalance()).toString());
  await bob.claimDefaultAccount();
  console.log("bob", await bob.getAddress(), (await bob.getBalance()).toString());

  console.log("signer", await signer.getAddress(), (await signer.getBalance()).toString());
});

task("nfts_transfer", "Transfer NFTs from account to Sqwid", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwid = await reef.getContractAt("SqwidERC1155", "0x49aC7Dc3ddCAb2e08dCb8ED1F18a0E0369515E47", signer);
  const toru = await reef.getContractAt("TorumoniERC1155", "0x7Ba1B370893dAeF1881D8A94519187B1d1C99E6E", signer);

  await toru.setApprovalForAll(sqwid.address, true);
  const tx: TransactionResponse = await sqwid.wrapERC1155(toru.address, 2, "image", 1);
  console.log(tx);
  const response = await tx.wait(1);
  console.log(response);

  process.exit(0);
});

task("balance0", "Balance of account", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const toru = await reef.getContractAt("TorumoniERC1155", "0x7Ba1B370893dAeF1881D8A94519187B1d1C99E6E", signer);
  const addr = await signer.getAddress();
  console.log("0", await toru.balanceOf(addr, 0));
  console.log("1", await toru.balanceOf(addr, 1));
  console.log("2", await toru.balanceOf(addr, 2));
  console.log("15", await toru.balanceOf(addr, 15));
  console.log("16", await toru.balanceOf(addr, 16));

  process.exit(0);
});

task("balance1", "Balance of account", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwid = await reef.getContractAt("SqwidERC1155", "0x49aC7Dc3ddCAb2e08dCb8ED1F18a0E0369515E47", signer);
  console.log(await sqwid.balanceOf(await signer.getAddress(), 22));

  process.exit(0);
});

task("create_item", "Create new item", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwidMarketplace = await reef.getContractAt("SqwidMarketplace", "0xd3202Ee6077C7cc25eAea3aE11bec2cD731D19FC", signer);

  const tx = await sqwidMarketplace.createItem(22);
  console.log(tx);
  const response = await tx.wait(1);
  console.log(response);
  // sqwidMarketplace.on("ItemCreated", (itemId, address, tokenId, sender, _) => {
  //   console.log("ItemCreated", itemId, address, tokenId, sender);
  // });

  process.exit(0);
});

task("decode0", "Decode events", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwid = await reef.getContractAt("SqwidERC1155", "0x49aC7Dc3ddCAb2e08dCb8ED1F18a0E0369515E47", signer);

  const decode = sqwid.interface.decodeEventLog(
    "WrapToken",
    "0x0000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000007ba1b370893daef1881d8a94519187b1d1c99e6e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001",
    ["0x1d192f24083e272060b4a5cb467949d52c069de89db73d5be0bc9ce4c30886c7"]
  );

  console.log(decode);

  process.exit(0);
});

task("decode2", "Decode events", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwidMarketplace = await reef.getContractAt("SqwidMarketplace", "0xd3202Ee6077C7cc25eAea3aE11bec2cD731D19FC", signer);

  const decode = sqwidMarketplace.interface.decodeEventLog(
    "PositionUpdate",
    "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    [
      "0x4aeec3ce160b91edb76c243eba54b14d0ec8dd3332254ff99f79eb00d17b5683",
      "0x000000000000000000000000000000000000000000000000000000000000001d",
      "0x0000000000000000000000000000000000000000000000000000000000000007",
      "0x0000000000000000000000008a2acd93b965d536913254b1f68e9c45df3780c7",
    ]
  );

  console.log(decode);

  process.exit(0);
});

task("decode1", "Decode events", async (_, hre) => {
  const reef = hre.reef;
  const signer = await reef.getSignerByName("account1");
  const sqwid = await reef.getContractAt("SqwidERC1155", "0x49aC7Dc3ddCAb2e08dCb8ED1F18a0E0369515E47", signer);

  const decode = sqwid.interface.decodeEventLog(
    "TransferSingle",
    "0x00000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000001",
    [
      "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
      "0x0000000000000000000000008a2acd93b965d536913254b1f68e9c45df3780c7",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000008a2acd93b965d536913254b1f68e9c45df3780c7",
    ]
  );

  console.log(decode.id.toString());

  process.exit(0);
}); */
