import * as dotenv from 'dotenv'

import { task, HardhatUserConfig } from 'hardhat/config'
import '@reef-defi/hardhat-reef'
import { ReefNetworkConfig } from '@reef-defi/hardhat-reef/dist/src/types'

dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
	const [signer] = await hre.reef.getSigners()
	await signer.claimDefaultAccount()

	const bob = await hre.reef.getSignerByName('bob')
	console.log('bob', await bob.getAddress(), (await bob.getBalance()).toString())
  await bob.claimDefaultAccount();
	console.log('bob', await bob.getAddress(), (await bob.getBalance()).toString())

	console.log('signer', await signer.getAddress(), (await signer.getBalance()).toString())
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const reef: ReefNetworkConfig = {
	url: 'ws://localhost:9944',
	gas: 'auto',
	gasPrice: 'auto',
	gasMultiplier: 1,
	timeout: 10000,
	httpHeaders: {},
	accounts: 'remote',
}

const config: HardhatUserConfig = {
	solidity: '0.8.4',
	defaultNetwork: 'reef',
	networks: { reef },
}

export default config
