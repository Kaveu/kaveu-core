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
    // The price of `_claws`
    uint256 public price_claws;
    // The safe address
    address private _safe_address;
    // The `_baseUri` that stores the json file
    string private _baseUri;
    // Total claws with a given id
    mapping(uint256 => uint256) private _claws;

    constructor(
        uint256 price_claws_,
        address safe_address_,
        string memory uri_
    ) ERC1155(uri_) {
        price_claws = price_claws_;
        _safe_address = safe_address_;
        _baseUri = uri_;

        uint256[] memory ids = new uint256[](MAX_SUPPLY);
        uint256[] memory amounts = new uint256[](MAX_SUPPLY);
        for (uint256 i = 0; i < MAX_SUPPLY; i++) {
            ids[i] = i + 1;
            amounts[i] = 1;
            _claws[i + 1] = 2;
        }
        _claws[1] = 340;
        _mintBatch(_safe_address, ids, amounts, "");
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() external pure returns (string memory) {
        return "Kaveu";
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() external pure returns (string memory) {
        return "KVU";
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     */
    function uri(uint256 _tokenId) public view override returns (string memory) {
        require(exists(_tokenId), "KaveuERC1155: the item does not exist");
        return string(abi.encodePacked(_baseUri, _tokenId.toString(), ".json"));
    }

    /**
     * @dev See {ERC1155-_setURI}.
     */
    function setUri(string memory _newUri) public onlyOwner {
        _baseUri = _newUri;
        _setURI(_newUri);
    }

    function clawsOf(uint256 _tokenId) public view returns (uint256) {
        require(exists(_tokenId), "KaveuERC1155: the item does not exist");
        return _claws[_tokenId];
    }

    /**
     * @dev Increase `claws` of `id` by `_incBy` by sending a minimum amount.
     * The function decrease does not exist.
     */
    function increaseClaws(uint256 _tokenId, uint256 _incBy) public payable {
        uint256 prices = _incBy * price_claws;
        require(msg.value >= prices);
        _claws[_tokenId] += _incBy;
    }

    /**
     * @dev See {Address-sendValue}.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(_safe_address).call{value: address(this).balance}("");
        require(success, "Address: unable to send value");
    }
}
