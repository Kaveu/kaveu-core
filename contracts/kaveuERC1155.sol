// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 *
 * @author Rao Nagos
 * KaveuERC1155 - Kaveu - KVU
 * Project URL : (soon)
 * Contact : (soon)
 * Kaveu is a project based on NFTs which are used as a key to be allowed to use an arbitration bot on CEXs/DEXs.
 * Each NFT has a basic `claws` to arbitrate 2 tokens on the C/DEXs. The `claws` can be borrowed from third parties if the owners allows it.
 * More info on the official website.
 *
 */
contract kaveuERC1155 is ERC1155Supply, ERC1155Holder, Ownable {
    using Strings for uint256;

    // The `MAX_SUPPLY` that can be mined
    uint256 public constant MAX_SUPPLY = 34;
    // The `_baseUri` that stores the json file
    string private _baseUri;

    constructor(string memory uri_) ERC1155(uri_) {
        _baseUri = uri_;
        for (uint256 i = 1; i <= MAX_SUPPLY; i++) {
            _mint(msg.sender, i, 1, bytes(abi.encodePacked("KVU #", Strings.toString(i))));
        }
    }

    /**
        @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() external pure returns (string memory) {
        string memory collection = "Kaveu";
        return collection;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() external pure returns (string memory) {
        string memory symbol_ = "KVU";
        return symbol_;
    }

    /**
        @dev See {IERC1155MetadataURI-uri}.
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(exists(_tokenId), "KaveuERC1155: the item does not exist");
        string memory tokenUri = string(abi.encodePacked(_baseUri, Strings.toString(_tokenId), ".json"));
        return tokenUri;
    }

    // Set the `_baseUri' to the '_newUri'
    function setUri(string memory _newUri) public onlyOwner {
        _baseUri = _newUri;
        _setURI(_newUri);
    }
}
