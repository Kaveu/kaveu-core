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
 * Project URL : https://kaveu.io
 * Kaveu is a project based on NFTs which are used as a key to be allowed to use an arbitration bot on CEXs/DEXs.
 * Each NFT has a basic `claws` to arbitrate 2 tokens on the C/DEXs. The `claws` can be borrowed from third parties if the owners allows it.
 * More info on the official website.
 *
 */
contract KaveuERC721 is ERC721, ERC721Holder, Ownable {
    using Strings for uint256;

    // The `MAX_SUPPLY` that can be mined
    uint256 public constant MAX_SUPPLY = 5;
    // The price of claw
    uint256 public priceClaws;
    // The safe address to withdraw or to sell tokens
    address private _safeAddress;
    // The `_baseUri` that stores the json file
    string private _baseUri;
    // Total claws with a given id
    mapping(uint256 => uint256) private _claws;

    modifier existToken(uint256 tokenId) {
        require(_exists(tokenId), "KaveuERC721: the token does not exist");
        _;
    }

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
     * @dev Returns the `MAX_SUPPLY`.
     */
    function totalSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId) public view virtual override existToken(_tokenId) returns (string memory) {
        return string(abi.encodePacked(_baseUri, _tokenId.toString(), ".json"));
    }

    /**
     * @dev Returns the number of claws of the `_tokenId`.
     */
    function clawsOf(uint256 _tokenId) public view existToken(_tokenId) returns (uint256) {
        return _claws[_tokenId];
    }

    /**
     * @dev Sets the `_baseUri` by the `_newUri`.
     */
    function setUri(string memory _newUri) external onlyOwner {
        _baseUri = _newUri;
    }

    /**
     * @dev Sets the `priceClaws` by the `_newPriceClaws`.
     */
    function setPriceClaws(uint256 _newPriceClaws) external onlyOwner {
        priceClaws = _newPriceClaws;
    }

    /**
     * @dev Increases by 4 owner claws.
     */
    function airdrop() external onlyOwner {
        for (uint256 id = 2; id <= MAX_SUPPLY; id++) {
            _claws[id] += (7 - 2 - 1);
        }
    }

    /**
     * @dev Returns the balance of the contract.
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev See {Address-sendValue}.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(_safeAddress).call{value: address(this).balance}("");
        require(success, "Address: unable to send value");
    }

    /**
     * @dev Increases claws of the token by `_incBy` by sending a minimum amount.
     * The `sender` must be the `owner` of the token and the `_tokenId` must be greater than 1.
     * Decreases claws does not exist.
     */
    function increaseClaws(uint256 _tokenId, uint256 _incBy) external payable onlyOwnerOf(_tokenId) {
        require(msg.value >= _incBy * priceClaws && _tokenId > 1, "KaveuERC721: unable to increase the token");
        _claws[_tokenId] += _incBy;
    }

    /////////////////////////////////////////////////////////////////////
    /////////////////////////// LOAN ////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    struct ClawLoan {
        uint256 pricePerDay;
        uint256 totalBorrow;
    }

    enum AssignState {
        DEFAULT,
        BY_OWNER,
        BY_BORROWER
    }

    struct ClawBorrow {
        uint256 deadline;
        uint256 totalAmount;
        uint256 totalBorrow;
        uint256 totalAssign;
        address caller;
        address borrower;
        AssignState assignState;
    }

    event ClawLoaning(uint256 indexed tokenId, uint256 indexed pricePerDay);
    event ClawBorrowed(uint256 indexed tokenId, address indexed borrower);

    uint256 constant DAY_IN_SECONDS = 86400;
    mapping(uint256 => ClawLoan) private _clawLoans;
    mapping(uint256 => mapping(address => ClawBorrow)) private _borrowers;
    address[] private _borrower_result;

    modifier onlyOwnerOf(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "KaveuERC721: you are not the owner");
        _;
    }

    /**
     * @dev Returns all {ClawLoan}.
     */
    function clawLoans() external view returns (ClawLoan[] memory cls) {
        cls = new ClawLoan[](MAX_SUPPLY);
        for (uint256 id = 1; id <= MAX_SUPPLY; id++) {
            cls[id - 1] = _clawLoans[id];
        }
        return cls;
    }

    /**
     * @dev Returns all {ClawBorrow} for a `_tokenId`. The bot uses this function to check if a borrower is allowed to use the bot.
     * More info on website.
     */
    function borrowOf(uint256 _tokenId) external view existToken(_tokenId) returns (ClawBorrow[] memory cbs) {
        uint256 ln = _borrower_result.length;
        cbs = new ClawBorrow[](ln);
        for (uint256 i = 0; i < ln; i++) {
            cbs[i] = _borrowers[_tokenId][_borrower_result[i]];
        }
    }

    function removeBorrower(uint256 index) private {
        _borrower_result[index] = _borrower_result[_borrower_result.length - 1];
        _borrower_result.pop();
    }

    /**
     * @dev Manually assigns a `_borrower` once to the `_tokenId` without paying the loan fee.
     * More info on website.
     */
    function assign(
        uint256 _tokenId,
        uint256 _forClaw,
        address _borrower
    ) external onlyOwnerOf(_tokenId) {
        ClawBorrow memory cb = _borrowers[_tokenId][_borrower];
        cb.totalAssign += _forClaw;

        require(cb.totalAssign <= _claws[_tokenId] && cb.assignState == AssignState.DEFAULT, "KaveuERC721: cannot assign the borrower");

        cb.deadline = block.timestamp + (31536000 * 721); // forever
        cb.assignState = AssignState.BY_OWNER;
        cb.caller = msg.sender;
        cb.borrower = _borrower;

        _borrowers[_tokenId][_borrower] = cb;
        _borrower_result.push(_borrower);

        emit ClawBorrowed(_tokenId, _borrower);
    }

    /**
     * @dev Deassigns a `_borrower` who has already been manually assigned from the `_tokenId`.
     */
    function deassign(
        uint256 _tokenId,
        uint256 _forClaw,
        address _borrower
    ) external onlyOwnerOf(_tokenId) {
        ClawBorrow storage cb = _borrowers[_tokenId][_borrower];
        cb.totalAssign -= _forClaw;

        require(cb.assignState == AssignState.BY_OWNER, "KaveuERC721: cannot deassign the borrower");

        if (cb.totalAssign == 0) {
            // clear
            for (uint256 i = 0; i < _borrower_result.length; i++) {
                if (_borrower_result[i] == _borrower) {
                    delete _borrowers[_tokenId][_borrower];
                    removeBorrower(i);
                    break;
                }
            }
        }
    }

    /**
     * @dev Create a loan for a `_tokenId` by setting a `_pricePerDay` and the maximum claws available. To stop the loan, set the `_pricePerDay` to 0 but this does not stop the current rentals.
     */
    function loan(uint256 _tokenId, uint256 _pricePerDay) external onlyOwnerOf(_tokenId) {
        ClawLoan storage cl = _clawLoans[_tokenId];
        cl.pricePerDay = _pricePerDay;

        emit ClawLoaning(_tokenId, _pricePerDay);
    }

    /**
     * @dev Create a borrow for a `_tokenId` by sending a minimum amount. Borrow until `_forDays` + `block.timestamp`.
     * If the owner of the `_tokenId` wants to sell it, he will have to pay back (ClawBorrow.totalAmount) the `ClawBorrow.caller` completely first, not for the days remaining.
     *
     * See {loan} to stop it.
     * See {_beforeTokenTransfer} to check the refunds.
     */
    function borrow(
        uint256 _tokenId,
        uint256 _forClaw,
        uint256 _forDays,
        address _borrower
    ) external payable existToken(_tokenId) {
        ClawLoan memory cl = _clawLoans[_tokenId];
        cl.totalBorrow += _forClaw;
        ClawBorrow memory cb = _borrowers[_tokenId][_borrower];

        require(cl.pricePerDay > 0 && cl.totalBorrow <= _claws[_tokenId] && cb.assignState == AssignState.DEFAULT, "KaveuERC721: cannot borrow");

        cb.deadline = block.timestamp + (_forDays * DAY_IN_SECONDS);
        cb.totalAmount = _forClaw * _forDays * cl.pricePerDay;
        cb.totalBorrow = _forClaw;
        cb.caller = msg.sender;
        cb.borrower = _borrower;
        cb.assignState = AssignState.BY_BORROWER;

        _clawLoans[_tokenId] = cl;
        _borrowers[_tokenId][_borrower] = cb;
        _borrower_result.push(_borrower);

        // pays loan fee
        require(msg.value >= cb.totalAmount, "KaveuERC721: not enought token");
        (bool success, ) = payable(ownerOf(_tokenId)).call{value: msg.value}("");
        require(success, "Address: unable to send value");

        emit ClawBorrowed(_tokenId, _borrower);
    }

    /**
     * @dev Clears the {ClawBorrow} if the `ClawBorrow.deadline` is reached. Anyone can call this function.
     */
    function clear() external {
        uint256 ln = _borrower_result.length;
        uint256[] memory array = new uint256[](ln);
        uint256 counter = 0;
        uint256 i;
        for (uint256 id = 1; id <= MAX_SUPPLY; id++) {
            for (i = 0; i < _borrower_result.length; i++) {
                ClawBorrow memory cb = _borrowers[id][_borrower_result[i]];
                if (cb.assignState != AssignState.DEFAULT && cb.deadline < block.timestamp) {
                    ClawLoan storage cl = _clawLoans[id];
                    cl.totalBorrow -= cb.totalBorrow;
                    array[counter] = i;
                    counter++;
                    delete _borrowers[id][_borrower_result[i]];
                }
            }
        }
        for (i = 0; i < counter; i++) {
            removeBorrower(array[i]);
        }
    }

    /**
     * @dev Check that there are no refunds to be made prior to the transfer. If there is, a refund is required to the `ClawBorrow.caller` for `ClawBorrow.totalAmount`, not for the days remaining.
     *  It is recommended to call the {clear} function first.
     * More info on website.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        if (from == address(0) || to == address(0)) {
            // first _mint() or _burn()
            return;
        }

        for (uint256 i = 0; i < _borrower_result.length; i++) {
            ClawBorrow memory cb = _borrowers[tokenId][_borrower_result[i]];
            if (cb.assignState == AssignState.BY_BORROWER) {
                // refunds the caller
                (bool success, ) = payable(cb.caller).call{value: cb.totalAmount}("");
                require(success, "Address: unable to send value");
                // to clear()
                cb.deadline = block.timestamp - 10;
                _borrowers[tokenId][_borrower_result[i]] = cb;
            }
        }
    }
}
