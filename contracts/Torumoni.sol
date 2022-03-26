// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// Crowdfunding
contract TorumoniERC1155 is ERC1155Supply, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 15;
    string private _baseUri;

    constructor(string memory uri_) ERC1155(uri_) {
        _baseUri = uri_;
        for (uint256 i = 1; i <= MAX_SUPPLY; i++) {
            _mint(msg.sender, i, 1, bytes(abi.encodePacked("MONI #", Strings.toString(i))));
        }
    }

    function name() public pure returns (string memory) {
        string memory collection = "Torumoni";
        return collection;
    }

    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(exists(_tokenId), "Torumoni : the item does not exist");
        return string(abi.encodePacked(_baseUri, Strings.toString(_tokenId), ".json"));
    }
}
