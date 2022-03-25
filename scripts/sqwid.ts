import { reef } from 'hardhat'

async function main() {
	const s0 = await reef.getSignerByName('account1')
	const sqwid = await reef.getContractAt('SqwidERC1155', '0x49aC7Dc3ddCAb2e08dCb8ED1F18a0E0369515E47', s0)
	console.log('SqwidERC1155 deployed to:', sqwid.address)
	const uri = await sqwid.uri(2)
	console.log('SqwidERC1155 uri of 2:', uri)
	process.exit(0)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exit(1)
})
