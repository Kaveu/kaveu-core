// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 *
 * @author Rao Nagos
 * KaveuERC721 - Kaveu - KVU
 * Project URL : (soon)
 * Contact : (soon)
 * Kaveu is a project based on NFTs which are used as a key to be allowed to use an arbitration bot on CEXs/DEXs.
 * Each NFT has a basic `claws` to arbitrate 2 tokens on the C/DEXs. The `claws` can be borrowed from third parties if the owners allows it.
 * More info on the official website.
 *
 */
contract KaveuERC721 is ERC721, ERC721Holder, Ownable {
    using Strings for uint256;

    // The `MAX_SUPPLY` that can be mined
    uint256 public constant MAX_SUPPLY = 34;
    // The price of claw
    uint256 public priceClaws;
    // The safe address to withdraw or to sell tokens
    address private _safeAddress;
    // The `_baseUri` that stores the json file
    string private _baseUri;
    // Total claws with a given id
    mapping(uint256 => uint256) private _claws;

    constructor(
        uint256 priceClaws_,
        address safeAddress_,
        string memory uri_
    ) ERC721("Kaveu", "KVU") {
        priceClaws = priceClaws_;
        _safeAddress = safeAddress_;
        _baseUri = uri_;

        for (uint256 id = 1; id <= MAX_SUPPLY; id++) {
            _claws[id] = 2;
            _mint(_safeAddress, id);
        }
        _claws[1] = 721;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(_baseUri, _tokenId.toString(), ".json"));
    }

    /**
     * @dev Set the `_baseUri` by the `_newUri`.
     */
    function setUri(string memory _newUri) external onlyOwner {
        _baseUri = _newUri;
    }

    /**
     * @dev Set the `priceClaws` by the `_newPriceClaws`.
     */
    function setPriceClaws(uint256 _newPriceClaws) external onlyOwner {
        priceClaws = _newPriceClaws;
    }

    /**
     * Increase by 4 claws of owners
     */
    function airdrop() external onlyOwner {
        for (uint256 id = 2; id <= MAX_SUPPLY; id++) {
            _claws[id] += (7 - 2 - 1);
        }
    }

    /**
     * @dev See {Address-sendValue}.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(_safeAddress).call{value: address(this).balance}("");
        require(success, "Address: unable to send value");
    }

    /**
     * @dev Returs all `ids` for a specific `_owner` and his claws.
     */
    function getTokensByOwner(address _owner) public view returns (uint256[] memory) {
        uint256[] memory tokens = new uint256[](MAX_SUPPLY);
        for (uint256 id = 1; id <= MAX_SUPPLY; id++) {
            if (ownerOf(id) == _owner) {
                tokens[id] = _claws[id];
            }
        }
        return tokens;
    }

    /**
     * @dev Returns the number of claws of the `_tokenId`.
     */
    function clawsOf(uint256 _tokenId) public view returns (uint256) {
        require(_exists(_tokenId), "KaveuERC721: the token does not exist");
        return _claws[_tokenId];
    }

    /**
     * @dev Increases claws of the token by `_incBy` by sending a minimum amount.
     * The `sender` must be the `owner` of the token and the `_tokenId` must be greater than 1.
     * Decreases claws does not exist.
     */
    function increaseClaws(uint256 _tokenId, uint256 _incBy) external payable {
        require(msg.value >= _incBy * priceClaws && ownerOf(_tokenId) == msg.sender && _tokenId > 1, "KaveuERC721: unable to increase the token");
        _claws[_tokenId] += _incBy;
    }

    /////////////////////////////////////////////////////////////////////
    /////////////////////////// LOAN ////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    // allow `maxClaw` to loan for `pricePerDay`
    struct LoanData {
        uint256 pricePerDay;
        uint256 maxClaw;
        uint256 totalLoaners;
    }

    struct LoanDate {
        uint64 startedAt;
        uint64 _nbDays;
    }

    mapping(uint256 => LoanData) private _loan;
    mapping(uint256 => mapping(address => LoanDate)) private _loaners;

    function createLoan(
        uint256 _tokenId,
        uint256 _maxClaw,
        uint256 _pricePerDay
    ) external {
        LoanData storage ld = _loan[_tokenId];

        if (_pricePerDay > 0) {
            ld.pricePerDay = _pricePerDay;
        }
        ld.maxClaw = _maxClaw;

        require(ld.totalLoaners <= ld.maxClaw && ld.maxClaw <= _claws[_tokenId] && ownerOf(_tokenId) == msg.sender, "Kaveu721: cannot create loan");
    }

    function fundLoan(
        uint256 _tokenId,
        uint256 _nbClaw,
        uint256 _nbDays
    ) external payable {
        LoanData storage ld = _loan[_tokenId];

        ld.totalLoaners += _nbClaw;
        LoanDate memory ldate;
        ldate.startedAt = now;
        ldate.nbDays = _nbDays;
        _loaners[_tokenId][msg.sender] = ldate;

        require(msg.value >= _nbClaw * _nbDays * ld.pricePerDay, "Kaveu721: not enought token");
        (bool success, ) = payable(ownerOf(_tokenId)).call{value: msg.value}("");
        require(success, "Address: unable to send value");
    }
}
