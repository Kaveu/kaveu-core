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
 * Repository URL : https://github.com/Kaveu/kaveu-core
 * Website URL : https://kaveu.io
 *
 * Kaveu is a project based on NFTs which are used as a key to be allowed to use an arbitration bot (IA) on CEXs/DEXs.
 * Each NFT has a basic `claws` to arbitrate 2 tokens on the C/DEXs. The same `claws` can be borrowed from third parties if the owners allows it.
 *
 */
contract KaveuERC721 is ERC721, ERC721Holder, Ownable {
    enum AssignState {
        DEFAULT,
        BY_OWNER,
        BY_BORROWER
    }

    struct BorrowData {
        uint256 deadline;
        uint256 totalAmount;
        uint256 totalBorrow;
        address caller;
        address borrower;
        AssignState assignState;
    }

    struct Claw {
        uint256 pricePerDay;
        uint256 totalBorrow;
        uint256 totalAssign;
        uint256 totalClaw;
        uint256 priceClaw;
    }

    event ClawLoaning(uint256 indexed tokenId, uint256 indexed pricePerDay);
    event ClawBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 indexed deadline);

    // The maximum supply that can be mined
    uint256 public constant MAX_SUPPLY = 5;
    // The safe address to withdraw or to sell tokens
    address private _safeAddress;
    // The base uri that stores the json file
    string private _baseUri;

    // Map {Claw} by the id of token
    mapping(uint256 => Claw) private _claws;
    // Map {BorrowData} by borrower address
    mapping(uint256 => mapping(address => BorrowData)) private _borrowers;
    address[] private _borrowerArray;

    /**
     * @dev Throws if the token does not exist.
     * See {ERC721-_exists}.
     *
     * @param tokenId The id of the token
     */
    modifier existToken(uint256 tokenId) {
        require(_exists(tokenId), "KaveuERC721: the token does not exist");
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     * See {IERC721-ownerOf}.
     *
     * @param tokenId The id of the token
     */
    modifier onlyOwnerOf(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "KaveuERC721: you are not the owner");
        _;
    }

    /**
     * @dev Set the {Claw.priceClaw} to 0.0001 ether (starting price) and {Claw.totalClaw} to 2.
     * Set the {_baseUri} and the {_safeAddress}.
     *
     * @param safeAddress_ The safe address of deployer
     * @param uri_ The CID of ipfs url
     */
    constructor(address safeAddress_, string memory uri_) ERC721("Kaveu", "KVU") {
        _safeAddress = safeAddress_;
        _baseUri = uri_;

        for (uint256 id = 1; id <= MAX_SUPPLY; id++) {
            _claws[id].totalClaw = id > 1 ? 2 : 721; // The one should never be sold
            _claws[id].priceClaw = 0.0001 ether;
            _mint(_safeAddress, id);
        }
    }

    /**
     * @return MAX_SUPPLY The maximum supply
     */
    function totalSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     *
     * @param _tokenId The id of the token
     * @return uri The uri token of {_tokenId}
     *
     */
    function tokenURI(uint256 _tokenId) public view virtual override existToken(_tokenId) returns (string memory) {
        return string(abi.encodePacked(_baseUri, Strings.toString(_tokenId), ".json"));
    }

    /**
     * @return balance The balance of the contract
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Allows the deployer to send the contract balance to the {_safeAddress}.
     */
    function withdraw() external onlyOwner {
        (bool success, ) = payable(_safeAddress).call{value: address(this).balance}("");
        require(success, "Address: unable to send value");
    }

    /**
     * @dev Allows the deployer to set the {_baseUri} by the {_newUri}.
     *
     * @param _newUri The new {_baseUri}
     */
    function setUri(string memory _newUri) external onlyOwner {
        _baseUri = _newUri;
    }

    /**
     * @dev Allows the owner to increase claws of the {_tokenId} by {_incBy} by sending a minimum amount.
     * The {Claw.priceClaw} is updated according to the formula: {Claw.totalClaw} * 1,7614 ether.
     * !! Decreases claws does not exist.
     *
     * Throws if the {_tokenId} is less than 1 and if the {value} is less than the required amount.
     *
     * @param _tokenId The id of the token
     * @param _incBy The number of claws to add
     */
    function increaseClaws(uint256 _tokenId, uint256 _incBy) external payable onlyOwnerOf(_tokenId) {
        require(msg.value >= _incBy * _claws[_tokenId].priceClaw && _tokenId > 1, "KaveuERC721: unable to increase the token");
        _claws[_tokenId].totalClaw += _incBy;
        _claws[_tokenId].priceClaw = _claws[_tokenId].totalClaw * 138696.25 gwei; // 1,7614 = 12,7 / 7,21
    }

    /**
     * @dev Allows the deployer to increase by 4, all owner claws except the id one.
     * This function affects the {increaseClaws} function.
     *
     * Throws if done twice.
     */
    bool public airdropReached = false;

    function airdrop() external onlyOwner {
        require(airdropReached == false, "KaveuERC721: unable to make an airdrop");
        for (uint256 id = 2; id <= MAX_SUPPLY; id++) _claws[id].totalClaw += (7 - 2 - 1);
        airdropReached = true;
    }

    /////////////////////////////////////////////////////////////////////
    /////////////////////////// LOAN ////////////////////////////////////
    /////////////////////////////////////////////////////////////////////

    /**
     * @param _tokenId The id of the token
     * @return claw The {Claw} of the {_tokenId}
     */
    function clawsOf(uint256 _tokenId) public view existToken(_tokenId) returns (Claw memory) {
        return _claws[_tokenId];
    }

    /**
     * @dev The IA uses this function to check if a borrower is allowed to use him.
     *
     * @param _tokenId The id of the token
     * @return borrowDatas An array of {BorrowData} of the {_tokenId}
     * @return size The size of not null `borrowDatas`
     */
    function borrowOf(uint256 _tokenId) external view existToken(_tokenId) returns (BorrowData[] memory, uint256) {
        uint256 ln = _borrowerArray.length;
        uint256 cbsIndex = 0;
        BorrowData[] memory cbs = new BorrowData[](ln);
        for (uint256 i = 0; i < ln; i++) {
            BorrowData memory cb = _borrowers[_tokenId][_borrowerArray[i]];
            if (cb.assignState != AssignState.DEFAULT) {
                cbs[cbsIndex] = cb;
                cbsIndex++;
            }
        }
        return (cbs, cbsIndex);
    }

    /**
     * @dev Removes {index} borrower from the array by calling the pop() function.
     * In fine : this will decrease the array length by 1.
     *
     * @param index The cute index
     */
    function removeBorrower(uint256 index) private {
        _borrowerArray[index] = _borrowerArray[_borrowerArray.length - 1];
        _borrowerArray.pop();
    }

    /**
     * @dev Manually assigns a {_borrower} once to the token {_tokenId} for 721 years and without paying the loan fee.
     * The {_borrower} is a dedicated account. Considere checking the website for more info.
     * !! The {Claw.assignState} is set by the owner.
     *
     * Throws if the {Claw.totalAssign} of the {_tokenId} is greater than the {Claw.totalClaw}.
     * And throws if the {BorrowData.assignState} of the {_borrower} is not an {AssignState.DEFAULT}.
     *
     * This emits the {ClawBorrowed} event.
     *
     * @param _tokenId The id of the token
     * @param _forClaw The number of claws the owner wants to borrow
     * @param _borrower The address of the borrower
     */
    function assign(
        uint256 _tokenId,
        uint256 _forClaw,
        address _borrower
    ) external onlyOwnerOf(_tokenId) {
        BorrowData memory cb = _borrowers[_tokenId][_borrower];
        Claw memory cl = _claws[_tokenId];
        cl.totalAssign += _forClaw;

        require(cl.totalAssign <= cl.totalClaw && cb.assignState == AssignState.DEFAULT, "KaveuERC721: cannot assign the borrower");

        cb.deadline = block.timestamp + (31536000 * 721); // 31536000 YEAR_IN_SECONDS
        cb.assignState = AssignState.BY_OWNER;
        cb.caller = msg.sender;
        cb.borrower = _borrower;

        _claws[_tokenId] = cl;
        _borrowers[_tokenId][_borrower] = cb;
        _borrowerArray.push(_borrower);

        emit ClawBorrowed(_tokenId, _borrower, cb.deadline);
    }

    /**
     * @dev Deassigns a {_borrower} who has already been manually assigned from the assign() function.
     * If {Claw.totalAssign} is 0, then it will clear the storage data.
     *
     * Throws if the {BorrowData.assignState} was not assigned by the owner.
     *
     * @param _tokenId The id of the token
     * @param _forClaw The number of claws the owner wants to borrow
     * @param _borrower The address of the borrower
     */
    function deassign(
        uint256 _tokenId,
        uint256 _forClaw,
        address _borrower
    ) external onlyOwnerOf(_tokenId) {
        Claw storage cl = _claws[_tokenId];
        cl.totalAssign -= _forClaw;

        require(_borrowers[_tokenId][_borrower].assignState == AssignState.BY_OWNER, "KaveuERC721: cannot deassign the borrower");

        if (cl.totalAssign == 0) {
            // clear
            for (uint256 i = 0; i < _borrowerArray.length; i++) {
                if (_borrowerArray[i] == _borrower) {
                    delete _borrowers[_tokenId][_borrower];
                    removeBorrower(i);
                    break;
                }
            }
        }
    }

    /**
     * @dev Create a loan for the {_tokenId} by setting a price {_pricePerDay}.
     * To stop the loan, set the {_pricePerDay} to 0 but this does not stop the current rentals.
     *
     * This emits {ClawLoaning} event.
     *
     * @param _tokenId The id of the token
     * @param _pricePerDay The price the caller wants to loan his claws
     */
    function loan(uint256 _tokenId, uint256 _pricePerDay) external onlyOwnerOf(_tokenId) {
        _claws[_tokenId].pricePerDay = _pricePerDay;

        emit ClawLoaning(_tokenId, _pricePerDay);
    }

    /**
     * @dev Create a borrow for a {_tokenId} by sending a minimum amount. Borrow until {_forDays} + {block.timestamp}.
     * If the owner of the {_tokenId} wants to sell it, he will have to pay back {BorrowData.totalAmount} the {BorrowData.caller} completely first, not for the days remaining.
     *
     * See {loan} to stop it.
     * See {_beforeTokenTransfer} to check the refunds.
     *
     * Throws if {Claw.pricePerDay} of the {_tokenId} is 0.
     * Throws if the {Claw.totalAssign} is greater than the {Claw.totalClaw}.
     * Throws if {BorrowData.assignState} is not an {AssignState.DEFAULT}.
     * And throws if the {value} is less than the required amount.
     *
     * This emits the {ClawBorrowed} event.
     *
     * @param _tokenId The id of the token
     * @param _forClaw The number of claws the caller wants to borrow
     * @param _forDays The number of days the caller wants to borrow
     * @param _borrower The address of the borrower
     *
     */
    function borrow(
        uint256 _tokenId,
        uint256 _forClaw,
        uint256 _forDays,
        address _borrower
    ) external payable existToken(_tokenId) {
        Claw memory cl = _claws[_tokenId];
        cl.totalBorrow += _forClaw;
        BorrowData memory cb = _borrowers[_tokenId][_borrower];

        require(cl.pricePerDay > 0 && cl.totalBorrow <= cl.totalClaw && cb.assignState == AssignState.DEFAULT, "KaveuERC721: cannot borrow");

        cb.deadline = block.timestamp + (_forDays * 86400); // 86400 DAY_IN_SECONDS
        cb.totalAmount = _forClaw * _forDays * cl.pricePerDay;
        cb.totalBorrow = _forClaw;
        cb.caller = msg.sender;
        cb.borrower = _borrower;
        cb.assignState = AssignState.BY_BORROWER;

        _claws[_tokenId] = cl;
        _borrowers[_tokenId][_borrower] = cb;
        _borrowerArray.push(_borrower);

        // pays loan fee
        require(msg.value >= cb.totalAmount, "KaveuERC721: not enought token");
        (bool success, ) = payable(ownerOf(_tokenId)).call{value: msg.value}("");
        require(success, "Address: unable to send value");

        emit ClawBorrowed(_tokenId, _borrower, cb.deadline);
    }

    /**
     * @dev Clears the storage data if the {BorrowData.deadline} is reached. Anyone can call this function.
     */
    function clear() external {
        uint256 ln = _borrowerArray.length;
        uint256[] memory array = new uint256[](ln);
        uint256 counter = 0;
        uint256 i;
        for (uint256 id = 1; id <= MAX_SUPPLY; id++)
            for (i = 0; i < _borrowerArray.length; i++) {
                BorrowData memory cb = _borrowers[id][_borrowerArray[i]];
                if (cb.assignState != AssignState.DEFAULT && cb.deadline < block.timestamp) {
                    Claw storage cl = _claws[id];
                    cl.totalBorrow -= cb.totalBorrow;
                    array[counter] = i;
                    counter++;
                    delete _borrowers[id][_borrowerArray[i]];
                }
            }

        for (i = 0; i < counter; i++) removeBorrower(array[i]);
    }

    /**
     * @dev Check that there are no refunds to be made prior to the transfer. If there is, a refund is required to the `BorrowData.caller` for `BorrowData.totalAmount`, not for the days remaining.
     * !! It is recommended to call the {clear} function first.
     *
     * Throws if the {value} is less than the required amount.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        // from _mint() or to _burn()
        if (from == address(0) || to == address(0)) return;

        for (uint256 i = 0; i < _borrowerArray.length; i++) {
            BorrowData memory cb = _borrowers[tokenId][_borrowerArray[i]];
            if (cb.assignState == AssignState.BY_BORROWER) {
                // refunds the caller
                (bool success, ) = payable(cb.caller).call{value: cb.totalAmount}("");
                require(success, "Address: unable to send value");
                // to clear()
                cb.deadline = block.timestamp - 10;
                _borrowers[tokenId][_borrowerArray[i]] = cb;
            }
        }
    }
}
