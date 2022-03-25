// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// Crowdfunding
contract TorumoniERC1155 is ERC1155, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 17;
    uint256 public costClaw;
    mapping(uint256 => uint256) private _claws;
    string private _baseUri;

    constructor(string memory uri_) ERC1155(uri_) {
        costClaw = 1 ether;
        _baseUri = uri_;
        uint256[] memory ids;
        uint256[] memory amounts;
        for (uint256 i = 0; i < MAX_SUPPLY; i++) {
            ids[i] = i + 1;
            amounts[i] = 1;
        }
        _mintBatch(msg.sender, ids, amounts, "MONI");
    }

    function name() public pure returns (string memory) {
        string memory collection = "Torumoni";
        return collection;
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseUri, Strings.toString(_tokenId), ".json"));
    }

    function setBaseUri(string memory baseUri_) public onlyOwner {
        _baseUri = baseUri_;
    }

    function clawsOf(uint256 tokenId) public view returns (uint256) {
        // require(_exists(tokenId), "Torumoni: TOKEN NOT EXISTS");
        return _claws[tokenId];
    }

    /**
        @dev Set +3 `_claws` of owners except the creator.
     */
    function airdrop() public onlyOwner {
        for (uint256 tokenId = 2; tokenId <= MAX_SUPPLY; tokenId++) {
            // if (ownerOf(tokenId) != owner()) {
                _claws[tokenId] += 3;
            // }
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
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Torumoni : WITHDRAW FAILED");
    }
}
