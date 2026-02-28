// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainCraftGame
 * @dev ERC-721 NFT contract representing unique games created on ChainCraft.
 *      Each token represents an on-chain game with metadata, rules, and leaderboard state.
 */
contract ChainCraftGame is ERC721, ERC721URIStorage, Ownable {
    /// @dev Token ID counter - starts at 0, incremented BEFORE mint so first token is 1
    uint256 private _nextTokenId;

    // ─── Structs ───────────────────────────────────────────────────────────────

    struct GameMetadata {
        string name;
        string genre;
        string description;
        address creator;
        uint256 createdAt;
        uint256 maxPlayers;
        bool isActive;
        uint256 playCount;
        uint256 totalScore;
    }

    struct Player {
        address wallet;
        uint256 score;
        uint256 gamesPlayed;
        bool isInGame;
        uint256 currentGameId;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 gameId;
        uint256 timestamp;
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    mapping(uint256 => GameMetadata) public games;
    mapping(address => Player) public players;
    mapping(uint256 => LeaderboardEntry[]) public gameLeaderboards;
    mapping(uint256 => address[]) public gamePlayers;
    mapping(uint256 => mapping(address => bool)) public gamePlayerAllowlist;

    // Global top scores
    LeaderboardEntry[10] public globalLeaderboard;

    // Platform fee in wei (0.0001 MON)
    uint256 public mintFee = 0.0001 ether;

    uint256 public totalGamesCreated;
    uint256 public totalPlaysRecorded;

    // ─── Events ────────────────────────────────────────────────────────────────

    event GameMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string genre,
        uint256 timestamp
    );

    event ScoreSubmitted(
        uint256 indexed gameId,
        address indexed player,
        uint256 score,
        uint256 timestamp
    );

    event PlayerJoinedGame(
        uint256 indexed gameId,
        address indexed player,
        uint256 timestamp
    );

    event GameActivated(uint256 indexed gameId, bool active);

    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    // ─── Constructor ───────────────────────────────────────────────────────────

    constructor(address initialOwner)
        ERC721("ChainCraftGame", "CCG")
        Ownable(initialOwner)
    {}

    // ─── Core Functions ────────────────────────────────────────────────────────

    /**
     * @dev Mint a new game NFT. Called by the backend after AI game design is complete.
     * @param to Creator's wallet address
     * @param tokenURI IPFS/Arweave URI with full game metadata JSON
     * @param name Game name
     * @param genre Game genre (e.g. "puzzle", "rpg", "strategy")
     * @param description Short description
     * @param maxPlayers Maximum concurrent players
     */
    function mintGame(
        address to,
        string memory tokenURI,
        string memory name,
        string memory genre,
        string memory description,
        uint256 maxPlayers
    ) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(bytes(name).length > 0, "Name required");
        require(maxPlayers >= 1 && maxPlayers <= 100, "Invalid player count");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        games[tokenId] = GameMetadata({
            name: name,
            genre: genre,
            description: description,
            creator: to,
            createdAt: block.timestamp,
            maxPlayers: maxPlayers,
            isActive: true,
            playCount: 0,
            totalScore: 0
        });

        totalGamesCreated++;

        emit GameMinted(tokenId, to, name, genre, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Record a player joining a game session
     */
    function joinGame(uint256 gameId) external {
        require(_exists(gameId), "Game does not exist");
        require(games[gameId].isActive, "Game not active");
        require(
            gamePlayers[gameId].length < games[gameId].maxPlayers,
            "Game is full"
        );

        if (!gamePlayerAllowlist[gameId][msg.sender]) {
            gamePlayerAllowlist[gameId][msg.sender] = true;
            gamePlayers[gameId].push(msg.sender);
        }

        players[msg.sender].isInGame = true;
        players[msg.sender].currentGameId = gameId;

        emit PlayerJoinedGame(gameId, msg.sender, block.timestamp);
    }

    /**
     * @dev Submit a score when a game session ends
     * @param gameId The game NFT token ID
     * @param score Player's score for this session
     */
    function submitScore(uint256 gameId, uint256 score) external {
        require(_exists(gameId), "Game does not exist");
        require(
            gamePlayerAllowlist[gameId][msg.sender] ||
                games[gameId].creator == msg.sender,
            "Not authorized for this game"
        );

        // Update player global stats
        players[msg.sender].score += score;
        players[msg.sender].gamesPlayed++;
        players[msg.sender].isInGame = false;
        players[msg.sender].wallet = msg.sender;

        // Update game aggregate stats
        games[gameId].playCount++;
        games[gameId].totalScore += score;
        totalPlaysRecorded++;

        // Add to game leaderboard
        LeaderboardEntry memory entry = LeaderboardEntry({
            player: msg.sender,
            score: score,
            gameId: gameId,
            timestamp: block.timestamp
        });
        gameLeaderboards[gameId].push(entry);

        // Try to update global top 10
        _updateGlobalLeaderboard(entry);

        emit ScoreSubmitted(gameId, msg.sender, score, block.timestamp);
    }

    /**
     * @dev Toggle game active/inactive (creator or owner only)
     */
    function setGameActive(uint256 gameId, bool active) external {
        require(_exists(gameId), "Game does not exist");
        require(
            ownerOf(gameId) == msg.sender || owner() == msg.sender,
            "Not authorized"
        );
        games[gameId].isActive = active;
        emit GameActivated(gameId, active);
    }

    // ─── View Functions ────────────────────────────────────────────────────────

    function getGame(uint256 gameId) external view returns (GameMetadata memory) {
        require(_exists(gameId), "Game does not exist");
        return games[gameId];
    }

    function getGamePlayers(uint256 gameId) external view returns (address[] memory) {
        return gamePlayers[gameId];
    }

    function getGameLeaderboard(uint256 gameId)
        external
        view
        returns (LeaderboardEntry[] memory)
    {
        return gameLeaderboards[gameId];
    }

    function getGlobalLeaderboard()
        external
        view
        returns (LeaderboardEntry[10] memory)
    {
        return globalLeaderboard;
    }

    function getPlayer(address wallet) external view returns (Player memory) {
        return players[wallet];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // ─── Admin ─────────────────────────────────────────────────────────────────

    function setMintFee(uint256 newFee) external onlyOwner {
        emit MintFeeUpdated(mintFee, newFee);
        mintFee = newFee;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }

    // ─── Internal ──────────────────────────────────────────────────────────────

    function _updateGlobalLeaderboard(LeaderboardEntry memory newEntry) internal {
        uint256 lowestIdx = 0;
        uint256 lowestScore = type(uint256).max;

        for (uint256 i = 0; i < 10; i++) {
            if (globalLeaderboard[i].player == address(0)) {
                globalLeaderboard[i] = newEntry;
                return;
            }
            if (globalLeaderboard[i].score < lowestScore) {
                lowestScore = globalLeaderboard[i].score;
                lowestIdx = i;
            }
        }

        if (newEntry.score > lowestScore) {
            globalLeaderboard[lowestIdx] = newEntry;
        }
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ─── ERC-721 Overrides ─────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
