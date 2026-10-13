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
| Compare contract and browser rules by value, not wording | Source-alignment tests: quote matrix, credit grant, food count, both starting pools, three trait tables, and the Polly tie-break over all 11,110 non-empty feed orders of length 1-4 plus the empty case | Passed |
| Compile the contract | `npm run compile` with pinned `solc` 0.8.37 | Passed, 0 errors, 4,076-byte creation bytecode, no constructor |
| Check the hand-written browser ABI against the compiled ABI | `src/web3.mjs` selectors, `getMarket()` word count, `TradeExecuted` layout | Passed, 6 of 6 |
| Check the bundled Keccak and commitment packing | `src/keccak.mjs` and `scripts/verify-history.mjs` against `viem` | Passed |

## Live acceptance status

Run against `0x3cb03a2bb399916482ffaff524d4dc44debb860d` on Monad Testnet, block `70664010`.

| # | Check | Result |
| --- | --- | --- |
| 1 | Local build matches the deployed bytecode | **Done.** Runtime code is a byte-exact suffix of the local creation bytecode |
| 2 | Deploy with a testnet wallet, confirm receipt and address | **Done.** Receipt status success, explorer page returns 200 |
| 3 | Claim credits, confirm `CreditsClaimed`, second claim reverts | **Done.** Granted 500; a second claim reverts, and the UI no longer offers it |
| 4 | Successful trade: receipt, balance, reserves, Polly, event | **Done.** 300 to 311, 30 to 29, `totalFeeds` 1, commitment set, `getPolly()` (1,1,1) |
| 5 | Second wallet trades first and the saved limit fails | **Done.** Price moved 13 to 14, the stale limit was refused, credits untouched |
| 6 | Browser traits equal `getPolly()` at the same block | **Done.** Agreement badge true on the published site |
| 7 | Event replay from the deployment block | **Done.** Digest and trade count both agree |
| 8 | Desktop and mobile views with the real contract configured | **Done.** Mobile renders the live market with no horizontal overflow and no console errors |

One item remains open and is stated as such: the live **write** path was exercised through the
interface using an injected signer backed by a real key, not through a consumer wallet extension. A
judge signing with MetaMask is therefore a path we have not reproduced ourselves.

`node scripts/live-e2e.mjs` re-runs checks 3 to 8 against the published site in a real browser.

## Steps behind the results above

1. Confirm the live contract matches the local build. `npm run compile` already succeeds with the pinned `solc` 0.8.37 and writes `build/PollyFeedMarket.json`; on-chain the deployed bytecode must equal that artifact, and explorer source verification must use the same compiler version with the optimizer at 200 runs.
2. Deploy it using a testnet-only wallet. Check the deployment receipt and the contract address in an explorer.
3. Connect one wallet and claim credits. Confirm the `CreditsClaimed` event and that a second claim reverts.
4. Submit a successful food trade. Check the transaction receipt, balance change, pool reserves, Polly's new state and `TradeExecuted` event.
5. Use a second wallet to trade before the first wallet uses its saved limit. Verify the first wallet's stale-price transaction fails. Check that the failed transaction leaves the game state unchanged. Testnet gas may still be charged.
6. Compare Polly's browser-calculated traits against `getPolly()` at the same block. Open the page in another browser and compare results.
7. Run `scripts/verify-history.mjs` from the deployment block and verify the final digest and trade count.
8. Inspect desktop and mobile views with the actual testnet contract configured. Save real receipt and explorer links.

**The live checks in the status table above have passed.** The bundled code and mock tests could not
have stood in for them, which is why they were run against a deployed contract.

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

`proof/video/live-desktop.png` and `proof/video/live-mobile.png` were captured from the published site in Testnet mode against the deployed contract, so those two do show live chain state. The demo video itself is hosted on YouTube and linked from the submission form; it is not committed to the repository.
