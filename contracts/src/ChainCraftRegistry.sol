// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChainCraftRegistry
 * @dev Central registry that tracks all deployed ChainCraftGame contracts,
 *      enabling multi-game discovery and cross-game leaderboards.
 */
contract ChainCraftRegistry {
    struct GameContract {
        address contractAddress;
        address creator;
        string name;
        string genre;
        uint256 deployedAt;
        bool isVerified;
    }

    mapping(uint256 => GameContract) public gameContracts;
    mapping(address => uint256[]) public creatorGames;
    mapping(string => uint256[]) public genreGames;

    uint256 public totalContracts;
    address public admin;

    event GameRegistered(
        uint256 indexed id,
        address indexed contractAddress,
        address indexed creator,
        string name
    );

    event GameVerified(uint256 indexed id, bool verified);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerGame(
        address contractAddress,
        address creator,
        string memory name,
        string memory genre
    ) external returns (uint256) {
        totalContracts++;
        uint256 id = totalContracts;

        gameContracts[id] = GameContract({
            contractAddress: contractAddress,
            creator: creator,
            name: name,
            genre: genre,
            deployedAt: block.timestamp,
            isVerified: false
        });

        creatorGames[creator].push(id);
        genreGames[genre].push(id);

        emit GameRegistered(id, contractAddress, creator, name);
        return id;
    }

    function verifyGame(uint256 id) external onlyAdmin {
        gameContracts[id].isVerified = true;
        emit GameVerified(id, true);
    }

    function getCreatorGames(address creator) external view returns (uint256[] memory) {
        return creatorGames[creator];
    }

    function getGenreGames(string memory genre) external view returns (uint256[] memory) {
        return genreGames[genre];
    }

    function getGameContract(uint256 id) external view returns (GameContract memory) {
        return gameContracts[id];
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }
}
