# End-to-end acceptance

## Tested without a live network

| Path | How it was checked | Result |
| --- | --- | --- |
| Open the game and load the assets | Browser interaction with bundled artwork | Passed |
| See ten food quotes and eight lessons | Browser DOM and JavaScript checks | Passed |
| Claim practice credits | Browser interaction | Passed |
| Buy a snack and feed Polly | Browser interaction and rules tests | Passed |
| Let another buyer move the quote | Browser interaction and rules tests | Passed |
| Reject an old maximum price | Browser interaction, no partial state change | Passed |
| Refresh the quote and trade again | Browser interaction | Passed |
| See public-state calculations and recent history | Browser interaction and rules tests | Passed in practice mode |
| Reset the game | Browser interaction | Passed |
| Open a mobile viewport | Browser layout and image checks | Passed |
| Connect a mock wallet | Fake EVM provider | Passed, simulated |
| Claim and trade over a mock JSON-RPC endpoint | Fake RPC responses and receipts | Passed, simulated |
| Independently compare mock traits | Browser code and fake contract values | Passed, simulated |
| Check public asset paths and forbidden server paths | HTTP smoke test | Passed |
| Compare contract and browser rules by value, not wording | Source-alignment tests: quote matrix, credit grant, food count, both starting pools, three trait tables, Polly tie-break over 11,111 feed orders | Passed |
| Compile the contract | `npm run compile` with pinned `solc` 0.8.37 | Passed, 0 errors, 4,076-byte creation bytecode, no constructor |
| Check the hand-written browser ABI against the compiled ABI | `src/web3.mjs` selectors, `getMarket()` word count, `TradeExecuted` layout | Passed, 6 of 6 |
| Check the bundled Keccak and commitment packing | `src/keccak.mjs` and `scripts/verify-history.mjs` against `viem` | Passed |

## Still required on Monad Testnet

1. Confirm the live contract matches the local build. `npm run compile` already succeeds with the pinned `solc` 0.8.37 and writes `build/PollyFeedMarket.json`; on-chain the deployed bytecode must equal that artifact, and explorer source verification must use the same compiler version with the optimizer at 200 runs.
2. Deploy it using a testnet-only wallet. Check the deployment receipt and the contract address in an explorer.
3. Connect one wallet and claim credits. Confirm the `CreditsClaimed` event and that a second claim reverts.
4. Submit a successful food trade. Check the transaction receipt, balance change, pool reserves, Polly's new state and `TradeExecuted` event.
5. Use a second wallet to trade before the first wallet uses its saved limit. Verify the first wallet's stale-price transaction fails. Check that the failed transaction leaves the game state unchanged. Testnet gas may still be charged.
6. Compare Polly's browser-calculated traits against `getPolly()` at the same block. Open the page in another browser and compare results.
7. Run `scripts/verify-history.mjs` from the deployment block and verify the final digest and trade count.
8. Inspect desktop and mobile views with the actual testnet contract configured. Save real receipt and explorer links.

**Acceptance is incomplete until these live checks pass.** The bundled code and mock tests cannot stand in for them.

## Commands

```bash
npm install                    # Pinned solc 0.8.37 and viem, for compile and deploy
npm test
node scripts/validate-assets.mjs
node scripts/http-smoke.mjs
python scripts/browser_e2e.py
python scripts/browser_wallet_mock_e2e.py
npm run compile
npm run deploy                 # Requires funded testnet wallet
FROM_BLOCK=YOUR_BLOCK node scripts/verify-history.mjs
```

`FROM_BLOCK` is required, not optional. The audit requests 100 blocks per call because the public RPC rejects wider `eth_getLogs` windows with HTTP 413, so the default of `0` means roughly 700,000 requests on the current Monad Testnet. In PowerShell use `$env:FROM_BLOCK="YOUR_BLOCK"` before `npm run audit`.

The image files in `proof/` are captured from the isolated browser tests. They show what ran locally. They are not proof of a real blockchain transaction.
