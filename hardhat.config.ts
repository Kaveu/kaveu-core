import { config } from "dotenv";
config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

const PK_MUMBAI_0 = process.env["PK_MUMBAI_0"] || "";
const PK_MUMBAI_1 = process.env["PK_MUMBAI_1"] || "";

const accounts = [PK_MUMBAI_0, PK_MUMBAI_1];

const mumbai = {
  chainId: 80001,
  url: process.env["HTTPS_MUMBAI_MORALIS"] || "",
  accounts,
};

const polygon = {
  chainId: 80001,
  url: process.env["HTTPS_POLYGON_MORALIS"] || "",
  accounts,
};

const hreConfig: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "mumbai",
  networks: { mumbai },
  etherscan: {
    apiKey: process.env["VERIFY_POLYGON_API_KEY"] || "",
  },
};

export default hreConfig;
