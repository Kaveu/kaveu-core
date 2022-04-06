import { expect } from "chai";
import { reef } from "hardhat";
import { utils } from "ethers";

describe("Kaveu721", function () {
  it("Should return the name, symbol & priceClaws", async () => {
    const signer = await reef.getSignerByName("account1");
    const kaveu = await reef.getContractAt("KaveuERC721", "0x683267BCFe64126d31C46d1A7a08EAC950d7268b", signer);

    expect(await kaveu.name()).to.equal("Kaveu");
    expect(await kaveu.symbol()).to.equal("KVU");
    expect((await kaveu.priceClaws()).toString()).to.equal(utils.parseEther("10").toString());
  });

  it("Should return the claws of token zero, one, two, 34 & 35", async () => {
    const signer = await reef.getSignerByName("account1");
    const kaveu = await reef.getContractAt("KaveuERC721", "0x683267BCFe64126d31C46d1A7a08EAC950d7268b", signer);

    expect(await kaveu.clawsOf(1)).to.eql(utils.parseUnits("721", "wei"));
    expect(await kaveu.clawsOf(2)).to.eql(utils.parseUnits("2", "wei"));
    expect(await kaveu.clawsOf(34)).to.eql(utils.parseUnits("2", "wei"));

    try {
      await kaveu.clawsOf(0);
      await kaveu.clawsOf(35);
    } catch (error) {
      expect(error).to.be.an("Error");
    }
  });
});
