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

    struct ClawLoan {
        uint256 pricePerDay;
        uint256 maxLoan;
        uint256 totalBorrow;
    }

    enum AssignState {
        DEFAULT,
        BY_OWNER,
        BY_BORROWER
    }

    struct ClawBorrow {
        uint256 startedAt;
        uint256 endAt;
        AssignState assigned;
    }

    event ClawBorrowed(uint256 indexed tokenId, address indexed borrower);

    uint256 constant DAY_IN_SECONDS = 86400;
    mapping(uint256 => ClawLoan) private _clawLoans;
    mapping(uint256 => mapping(address => ClawBorrow)) private _borrowers;
    address[] private claw_borrow_result;

    modifier onlyOwnerOf(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Kaveu721: you are not the owner");
        _;
    }

    /**
     * @dev Returns the `ClawLoan` for a `_tokenId`.
     */
    function loanOf(uint256 _tokenId) external view returns (ClawLoan memory) {
        ClawLoan memory cl = _clawLoans[_tokenId];
        return cl;
    }

    /**
     * @dev Returns the `ClawBorrow` for a `_tokenId`. The bot uses this function to check if the `_borrower` is allowed to use the bot.
     * More info on website.
     */
    function borrowOf(uint256 _tokenId) external view returns (ClawBorrow[] memory) {
        ClawBorrow[] memory cbs;
        uint256 cbsIndex = 0;
        for (uint256 i = 0; i < claw_borrow_result.length; i++) {
            if (_borrowers[_tokenId][claw_borrow_result[i]].assigned != AssignState.DEFAULT) {
                cbs[cbsIndex] = _borrowers[_tokenId][claw_borrow_result[i]];
                cbsIndex++;
            }
        }
        return cbs;
    }

    /**
     * @dev Manually assigns a `_borrower` to the `_tokenId` without paying the loan fee for 365 days.
     * More info on website.
     */
    function assign(uint256 _tokenId, address _borrower) external onlyOwnerOf(_tokenId) {
        ClawLoan storage cl = _clawLoans[_tokenId];
        ClawBorrow storage cb = _borrowers[_tokenId][_borrower];
        cl.totalBorrow += 1;

        require(cl.totalBorrow <= _claws[_tokenId] && cb.assigned == AssignState.DEFAULT, "Kaveu721: cannot assign the borrower");

        cb.startedAt = block.timestamp;
        cb.endAt = block.timestamp + (365 * DAY_IN_SECONDS);
        cb.assigned = AssignState.BY_OWNER;
        claw_borrow_result.push(_borrower);

        emit ClawBorrowed(_tokenId, _borrower);
    }

    /**
     * @dev Deassigns a `_borrower` who has already been manually assigned from the `_tokenId`.
     */
    function deassign(uint256 _tokenId, address _borrower) external onlyOwnerOf(_tokenId) {
        ClawLoan storage cl = _clawLoans[_tokenId];
        cl.totalBorrow -= 1;

        require(_borrowers[_tokenId][_borrower].assigned == AssignState.BY_OWNER, "Kaveu721: cannot deassign the borrower");
        uint256[] memory array;
        uint256 arrayIndex = 0;
        uint256 i;
        for (i = 0; i < claw_borrow_result.length; i++) {
            if (claw_borrow_result[i] == _borrower) {
                array[arrayIndex] = i;
                arrayIndex++;
                delete _borrowers[_tokenId][_borrower];
                break;
            }
        }
        for (i = 0; i < array.length; i++) {
            delete claw_borrow_result[array[i]];
        }
    }

    function loan(
        uint256 _tokenId,
        uint256 _maxLoan,
        uint256 _pricePerDay
    ) external onlyOwnerOf(_tokenId) {
        ClawLoan storage cl = _clawLoans[_tokenId];
        cl.pricePerDay = _pricePerDay;
        cl.maxLoan = _maxLoan;
        require(cl.totalBorrow <= cl.maxLoan && cl.maxLoan <= _claws[_tokenId], "Kaveu721: cannot create loan");
    }

    function cleanUp(uint256 _tokenId) external onlyOwnerOf(_tokenId) {
        uint256[] memory array;
        uint256 arrayIndex = 0;
        uint256 i;
        for (i = 0; i < claw_borrow_result.length; i++) {
            if (_borrowers[_tokenId][claw_borrow_result[i]].endAt < block.timestamp) {
                array[arrayIndex] = i;
                arrayIndex++;
                delete _borrowers[_tokenId][claw_borrow_result[i]];
            }
        }
        for (i = 0; i < array.length; i++) {
            delete claw_borrow_result[array[i]];
        }
    }

    function borrow(
        uint256 _tokenId,
        uint256 _forClaw,
        uint256 _forDays,
        address _borrower
    ) external payable {
        /* ClawLoan storage cl = _clawLoans[_tokenId];
        cl.totalBorrow += _forClaw;

        ClawBorrow storage cb = _borrowers[_tokenId][_borrower];

        if (cb.assigned == AssignState.DEFAULT) {
            cb.startedAt = block.timestamp;
            cb.endAt = block.timestamp + (_forDays * DAY_IN_SECONDS);
        }

        require(cl.totalBorrow <= cl.maxLoan && cl.maxLoan <= _claws[_tokenId], "Kaveu721: cannot create loan");

        // pays loan fee
        require(msg.value >= _forClaw * _forDays * cl.pricePerDay, "Kaveu721: not enought token");
        (bool success, ) = payable(ownerOf(_tokenId)).call{value: msg.value}("");
        require(success, "Address: unable to send value");

        cb.assigned = AssignState.BY_BORROWER;
        claw_borrow_result.push(_borrower);

        emit ClawBorrowed(_tokenId, _borrower); */
    }
}
