// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PollyFeedMarket
 * @notice On-chain sandbox AMM with zero-value nontransferable learning credits.
 * @dev Exact-output one-food swaps use simplified constant-product math:
 *      input = ceil(reserveCredits / (reserveFood - 1)).
 *      Credits have no redemption, transfer, cash value or money interface.
 */
contract PollyFeedMarket {
    uint8 public constant FOOD_COUNT = 10;
    uint8 public constant MEMORY_SIZE = 10;
    uint256 public constant STARTING_CREDITS = 500;
    uint8 public constant RULES_VERSION = 1;

    uint256[10] private creditReserves = [uint256(300),330,315,320,300,345,310,320,325,325];
    uint256[10] private foodReserves = [uint256(30),30,30,30,30,30,30,30,30,30];
    mapping(address => uint256) public credits;
    mapping(address => bool) public claimed;
    uint64[10] private feedCounts;
    uint8[10] private ring;
    uint8 private cursor;
    uint8 private memoryLength;
    uint64 public totalFeeds;
    uint8 public lastFood;
    bytes32 public historyCommitment;

    error InvalidFood();
    error AlreadyClaimed();
    error ClaimFirst();
    error NoLiquidity();
    error MaxPriceExceeded(uint256 currentPrice, uint256 maximumPrice);
    error InsufficientCredits(uint256 required, uint256 available);

    event CreditsClaimed(address indexed trader, uint256 amount);
    event TradeExecuted(address indexed trader, uint8 indexed foodId, uint256 price, uint64 tradeNo, bytes32 commitment);

    function claimCredits() external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        claimed[msg.sender] = true;
        credits[msg.sender] = STARTING_CREDITS;
        emit CreditsClaimed(msg.sender, STARTING_CREDITS);
    }

    // Quote is the exact number of learning credits needed for one virtual food.
    function quote(uint8 foodId) public view returns (uint256) {
        if (foodId >= FOOD_COUNT) revert InvalidFood();
        uint256 remaining = foodReserves[foodId];
        if (remaining <= 1) revert NoLiquidity();
        uint256 x = creditReserves[foodId];
        return (x + remaining - 2) / (remaining - 1);
    }

    function buyAndFeed(uint8 foodId, uint256 maxPrice) external {
        if (!claimed[msg.sender]) revert ClaimFirst();
        uint256 paid = quote(foodId);
        if (paid > maxPrice) revert MaxPriceExceeded(paid, maxPrice);
        uint256 balance = credits[msg.sender];
        if (balance < paid) revert InsufficientCredits(paid, balance);

        credits[msg.sender] = balance - paid;
        creditReserves[foodId] += paid;
        foodReserves[foodId] -= 1;
        feedCounts[foodId] += 1;
        totalFeeds += 1;
        ring[cursor] = foodId;
        cursor = uint8((uint256(cursor) + 1) % MEMORY_SIZE);
        if (memoryLength < MEMORY_SIZE) memoryLength += 1;
        lastFood = foodId;
        historyCommitment = keccak256(abi.encodePacked(
            historyCommitment, msg.sender, foodId, paid, totalFeeds
        ));
        emit TradeExecuted(msg.sender, foodId, paid, totalFeeds, historyCommitment);
    }

    function getMarket() external view returns (
        uint256[10] memory marketCredits,
        uint256[10] memory marketFood,
        uint64[10] memory totals,
        uint8[10] memory recentOldestFirst,
        uint8 length,
        uint64 trades,
        uint8 latestFood,
        bytes32 commitment
    ) {
        marketCredits = creditReserves;
        marketFood = foodReserves;
        totals = feedCounts;
        length = memoryLength;
        for (uint8 i = 0; i < length; i++) {
            uint256 slot = (uint256(cursor) + MEMORY_SIZE - uint256(length) + uint256(i)) % MEMORY_SIZE;
            recentOldestFirst[i] = ring[slot];
        }
        trades = totalFeeds;
        latestFood = lastFood;
        commitment = historyCommitment;
    }

    /** On-chain independently checkable, weighted short-memory evolution. */
    function getPolly() external view returns (uint8 palette, uint8 mood, uint8 habit) {
        if (memoryLength == 0) return (0, 0, 0);
        uint32[5] memory paletteScores;
        uint32[5] memory habitScores;
        for (uint8 i = 0; i < memoryLength; i++) {
            uint256 slot = (uint256(cursor) + MEMORY_SIZE - uint256(memoryLength) + i) % MEMORY_SIZE;
            uint8 food = ring[slot];
            uint32 weight = uint32(i) + 1;
            paletteScores[_paletteFor(food)] += weight;
            habitScores[_habitFor(food)] += weight;
        }
        palette = _winner(paletteScores, _paletteFor(lastFood));
        habit = _winner(habitScores, _habitFor(lastFood));
        mood = _moodFor(lastFood);
    }

    function _winner(uint32[5] memory scores, uint8 fallbackId) private pure returns (uint8) {
        uint32 high = 0; uint8 winner = 0;
        for (uint8 i = 0; i < 5; i++) {
            if (scores[i] > high) { high = scores[i]; winner = i; }
        }
        return scores[fallbackId] == high ? fallbackId : winner;
    }
    function _paletteFor(uint8 id) private pure returns (uint8) {
        uint8[10] memory m = [uint8(1),0,2,1,3,1,4,3,0,4]; return m[id];
    }
    function _habitFor(uint8 id) private pure returns (uint8) {
        uint8[10] memory m = [uint8(1),0,1,2,3,2,4,0,4,3]; return m[id];
    }
    function _moodFor(uint8 id) private pure returns (uint8) {
        uint8[10] memory m = [uint8(1),0,1,2,3,2,5,0,5,4]; return m[id];
    }
}
