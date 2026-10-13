# Technical design

## One shared contract

`PollyFeedMarket.sol` owns the game state on Monad Testnet. For each food, it holds a virtual food reserve and an internal credit reserve. A contract caller can claim a starting balance once, ask for a quote, or purchase one food portion and feed Polly.

The price formula is `ceil(creditReserve / (foodReserve - 1))`. It follows a small exact-output constant-product example with no fee. Rounding, low liquidity and sequential trades are part of the teaching example. This does not represent a full production AMM.

`buyAndFeed(foodId, maxPrice)` checks the user's starting balance, food availability and final accepted price. If these checks pass, a single transaction updates the internal balance, the two reserves, Polly's short memory and a chained history hash. `TradeExecuted` records the accepted action. If a check fails, the EVM rolls back the game-state changes. The caller may still pay testnet gas.

## Polly's memory

The contract keeps an ordered ring of the last ten food IDs. Newer meals have more weight for the feather palette and habit. The latest meal sets the immediate mood. The browser uses a separate implementation of the same rules to calculate an expected result. It reads both state and contract traits from the same block and checks that they agree.

This check detects differences between the browser's rules and the public contract. It does not prove that a wallet belongs to a unique person. It also does not make the web page immune to manipulation.

## Public history

The event commitment is updated as `keccak256(previousCommitment, trader, foodId, price, tradeNumber)` using Solidity's packed encoding. `scripts/verify-history.mjs` reads all events from a selected starting block, applies the same hash function, and checks the last event hash and count against the contract.

The public explorer remains the source of evidence for individual transactions. A local screenshot is never substituted for a receipt.

## How the browser works

The app is plain JavaScript and CSS. It does not need a build process for practice mode. The local market is saved in browser storage, while testnet mode reads live contract data. An injected EVM wallet sends signed transactions. The app waits for a receipt before it reports success.

The practice engine mirrors the pool formula and basic error rules. It is deliberately separate from the RPC code and clearly labeled on the screen. The mock-RPC browser test checks the wiring of wallet calls without pretending that an EVM was executed.

## Limits

No live contract has been included in this ZIP. Running the code locally cannot prove it works on Monad. Solidity compilation, real deployment, gas estimation, event replay and independent-browser confirmation must be completed with a real testnet wallet and a reachable RPC endpoint.
