// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TorumoniERC721 is ERC721, Ownable {
    uint256 public constant maxSupply = 7;
    uint256 public costClaw;
    mapping(uint256 => uint256) private _claws;

    constructor() ERC721("Torumoni", "MONI") {
        costClaw = 1 ether;
        for (uint256 tokenId = 1; tokenId <= maxSupply; tokenId++) {
            _mint(msg.sender, tokenId);
            if (tokenId == 1) {
                _claws[tokenId] = 101;
            } else {
                _claws[tokenId] = 2;
            }
        }
    }

    function clawsOf(uint256 tokenId) public pure returns (uint256) {
        require(_exists(tokenId), "Torumoni: TOKEN NOT EXISTS");

        return _claws[tokenId];
    }

    /**
        @dev See {ERC721-_baseURI}.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "";
    }

    /**
        @dev Set +3 `_claws` of owners except the creator.
     */
    function airdrop() public onlyOwner {
        for (uint256 tokenId = 2; tokenId <= maxSupply; tokenId++) {
            if (ownerOf(tokenId) != owner()) {
                _claws[tokenId] += 3;
            }
        }
    }

    /**
        @dev Update the `costClaw` with `_costClaw`.
     */
    function setCostClaw(uint256 _costClaw) public onlyOwner {
        costClaw = _costClaw;
    }

    /**
        @dev See {@openzeppelin-utils/Address.sol}.
     */
    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(
            success,
            "Address: unable to send value, sender may have reverted"
        );
    }
}
