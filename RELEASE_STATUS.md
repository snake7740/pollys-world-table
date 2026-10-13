# Release status

**Build:** Polly's World Table: Feed & Trade Lab v3

This package contains the finished game source, original Polly artwork, the matching scene and
learning icons, the market contract, deployment and verification helpers, test tools, and English
design notes.

## Verified locally

- All 22 rule and source-alignment tests pass.
- All 55 required gameplay images are found at the paths the code asks for.
- The HTTP smoke test passes for public and forbidden paths, on Windows as well as Linux.
- `contracts/PollyFeedMarket.sol` compiles with the pinned `solc` **0.8.37**: no errors, 4,076 bytes
  of creation bytecode, and no constructor, so deployment takes no arguments.
- The ABI hand-written into `src/web3.mjs` matches the compiled contract on all six function
  selectors, on the 44 return words of `getMarket()`, and on the indexed layout of `TradeExecuted`.
- `src/keccak.mjs` matches `viem` on every hash vector tested, and the event-replay packing in
  `scripts/verify-history.mjs` reproduces `abi.encodePacked(bytes32,address,uint8,uint256,uint64)`.
- The quote formula, the credit grant, the food count, both starting pools, the three Polly trait
  tables and the short-memory tie-break are compared **by value** against the contract source. A
  changed constant, formula or trait table on either side fails the suite; this was confirmed by
  deliberately introducing six such drifts and watching each one turn the suite red.

## Verified on Monad Testnet

Deployed 13 Oct 2026. Contract `0x3cb03a2bb399916482ffaff524d4dc44debb860d`, block `70664010`,
deploy tx `0x0e2395160c9bc508a7404ed50ef8b3d542691f46426d1aa70fe71a4c4a0ff975`.

- The deployed runtime bytecode is a byte-exact suffix of the locally built creation bytecode.
- Fresh state matched the predicted constants exactly: reserves 300/330/315, 30 portions each,
  `totalFeeds` 0, empty memory, a zero commitment, and `getPolly()` returning (0,0,0).
- `claimCredits()` granted 500. A second claim reverts.
- A successful buy moved reserves 300 to 311, portions 30 to 29, `totalFeeds` to 1, set a non-zero
  commitment, and made `getPolly()` return (1,1,1), which equals the browser's own derivation.
- A buy with a limit below the price was **mined as a failed transaction** (status `0x0`,
  tx `0x3c0e346d46041cbbbf45c404a13dfaf0991649570cb6641b95a412ad424a5f3e`) and changed nothing.
- With a second wallet trading first, a saved limit became stale and was refused, and that wallet's
  credits were untouched.
- `FROM_BLOCK=<deployment block> node scripts/verify-history.mjs` replays every `TradeExecuted`
  event, rebuilds the commitment chain, and agrees with the contract on digest and trade count.
- `node scripts/live-e2e.mjs` drives the **published site in a real browser** through connect,
  trade, feed history, the independent trait check, and a mobile viewport, with no console errors.
  It reports 12 of 13 checks passing; the one flaky check is the harness's own purchase step, which
  sometimes does not land within its wait window even though the same path succeeded in an earlier
  run. Treat that line as a harness defect, not a product claim.

## What the product is, stated plainly

The market is a simulation in what it trades and real in how it settles. Quotes, price limits,
balances, the shared parrot and the trade history all live in the contract and are enforced there.
There is no liquidity, no order book, no custody and no cash value, and the pricing rule is a
deliberately simplified constant-product quote for teaching, not a new market algorithm.

## Still open

- The two videos must be recorded and hosted publicly, and their URLs entered on the submission form.
- The live end-to-end harness has one flaky assertion to stabilise.
- Practice mode keeps browser state in `localStorage`; the live path does not.

## Quick start

Run `npm run dev` and visit `http://localhost:4173`. Practice mode needs no wallet, no chain and no
`npm install`. To repeat every local check, run `npm test`, `node scripts/validate-assets.mjs` and
`node scripts/http-smoke.mjs`. Against the deployed contract, run `node scripts/live-e2e.mjs`.
