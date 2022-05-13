// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./KaveuERC721.sol";

contract KaveuUtils {
    KaveuERC721 kaveu;

    constructor(KaveuERC721 kaveu_) {
        kaveu = kaveu_;
    }

    /**
     * @dev Call once a time all the owners.
     *
     * @return owners All owners
     */
    function getOwners() external view virtual returns (address[] memory) {
        address[] memory owners = new address[](kaveu.MAX_SUPPLY());
        for (uint256 tokenId = 1; tokenId <= kaveu.MAX_SUPPLY(); tokenId++) owners[tokenId - 1] = kaveu.ownerOf(tokenId);
        return owners;
    }

    /**
     * @dev Call once a time all the tokens uri.
     *
     * @return uris All tokens uri
     */
    function getTokenURIs() external view virtual returns (string[] memory) {
        string[] memory uris = new string[](kaveu.MAX_SUPPLY());
        for (uint256 tokenId = 1; tokenId <= kaveu.MAX_SUPPLY(); tokenId++) uris[tokenId - 1] = kaveu.tokenURI(tokenId);
        return uris;
    }
}
