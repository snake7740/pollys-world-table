# Polly's World Table: Feed & Trade Lab

**Feed Polly. See how a trade works.**

One parrot. Ten foods. One public snack market. A trade updates the market and the shared parrot together.

This is a small learning game for **Monad Metropolis, Onchain Finance & Trading**. The fun part is choosing Polly's next snack. The deeper part is seeing why a price changes, why a transaction can fail, and how anyone can check the result.

## Try it in a minute

You need **Node.js 20 or newer**. The local demo has no external dependencies.

```bash
npm run dev
```

Open **http://localhost:4173**.

Choose **Try the game**. Get your play credits. Pick a food, accept a quote, and feed Polly. Press **Let another player buy first** to see why your old price may fail. Then accept a fresh quote and try again.

The local demo uses browser storage. It makes **no blockchain transactions**. The entire market is private to that browser in practice mode.

## What players learn

| Step | What to try | What it shows |
| --- | --- | --- |
| See the shared market | Look at the pools | Public rules and readable state |
| Get play credits | Claim once | Account balances inside a contract |
| Watch prices change | Inspect the next quote | The price effect of changing reserves |
| Choose your price limit | Save an acceptable price | Protection against a stale quote |
| See who trades first | Let another buyer go first | Execution order can change your trade |
| See success or rollback | Attempt the old price, then retry | An operation commits fully or rolls back |
| Watch Polly change | Complete a purchase and feed | Everyone can read the new shared state |
| Check the public proof | Inspect a live receipt | A public record can be checked again |

The final step needs a **deployed contract and a confirmed testnet transaction**. Practice mode explains it but cannot prove it.

## What actually happens

Each food has a tiny virtual reserve pool. The game buys exactly one portion at a time. The quote is an integer approximation of a constant-product swap:

```text
price = ceil(credits_in_pool / (food_in_pool - 1))
```

After a successful purchase, the pool gains that many internal credits and loses one food portion. The next quote may rise. A player sets a maximum accepted price. The contract checks that maximum when the trade executes.

A successful contract call changes the player's play-credit balance, the selected food pool, Polly's recent meals, and the public event history **in one transaction**. When a check fails, those game changes are rolled back. An unsuccessful on-chain transaction may still use testnet MON to pay a network fee.

Play credits are contract counters. **They cannot be sent to another user, exchanged, sold, or redeemed.** There are no ERC-20 tokens, payments, NFTs, wallets with custody, or financial incentives.

## The two modes

**Practice mode** works right away. It is fully simulated, with a second simulated buyer for the price-race lesson.

**Monad Testnet mode** uses a browser wallet. It reads and calls an actual deployed contract. The UI checks the contract's calculated Polly traits against an independent browser calculation at a matching block height. A history audit script can replay the contract's trading events and check the final commitment.

### Deploy your own testnet contract

1. Install Node.js 20+ and a compatible browser wallet. Use a testnet-only account.
2. Get testnet MON for gas. Check the testnet network settings in the [official Monad documentation](https://docs.monad.xyz/).
3. Install the optional deployment tools when connected to the internet:

   ```bash
   npm install
   npm run compile
   ```

   `package.json` pins `solc` to **0.8.37**. Compile with that release: bytecode differs between compiler versions, and block-explorer source verification only matches the release that produced the deployed bytecode. `contracts/PollyFeedMarket.sol` asks for `^0.8.24`, so 0.8.37 is accepted.

4. Copy `.env.example` to `.env`. Add a **testnet-only** `DEPLOYER_PRIVATE_KEY`. Do not commit or share it.
5. Run `npm run deploy`. The script checks the chain ID is `10143` and waits for a successful deployment receipt.
6. The deployment script saves the contract address in `config.js` and the transaction details in `deployments/monad-testnet.json`.
7. Run `npm run dev`. Open the site. Choose **Monad Testnet**, connect your wallet, claim credits, and feed Polly.
8. Check the transaction in the explorer. Run `FROM_BLOCK=<deployment_block> npm run audit` (or `node scripts/verify-history.mjs`) after the network has returned all event logs. **Set `FROM_BLOCK` to the deployment block.** The audit requests logs 100 blocks at a time - the public RPC rejects anything wider with HTTP 413 - so the default of `0` on a chain tens of millions of blocks old means roughly 700,000 sequential RPC calls and will not finish.

You can use **Remix IDE** to compile and deploy `contracts/PollyFeedMarket.sol` if you prefer. Set the Remix compiler to **0.8.37** with the optimizer enabled at **200 runs**, matching `npm run compile`, so the verified source reproduces the deployed bytecode. In that case, put the deployed address into `config.js` yourself. Do not publish an invented contract address.

Monad Testnet: chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, testnet block explorer `https://testnet.monadscan.com`. Both endpoints were re-checked on 13 Oct 2026: the RPC answers `eth_chainId` with `0x279f`, and the explorer serves `/tx/<hash>` and `/address/<addr>`. `testnet.monadvision.com` was found to fail with a client-side application error, which is why it is no longer referenced here.

**Live deployment.** This build is deployed and verified on Monad Testnet: contract `0x3cb03a2bb399916482ffaff524d4dc44debb860d`, deployed at block `70664010`, playable at `https://snake7740.github.io/pollys-world-table/`. Receipts and the full acceptance record are in `RELEASE_STATUS.md` and `docs/SUBMISSION_FIELDS_EN.md`.

## Tests and evidence

```bash
npm run check               # Rules, assets and the HTTP allowlist
npm test                    # Trading rules, failure cases and contract alignment
node scripts/validate-assets.mjs
node scripts/http-smoke.mjs
node scripts/live-e2e.mjs   # Drives the published site against the deployed contract
python scripts/browser_e2e.py
python scripts/browser_wallet_mock_e2e.py
```

`npm run check` needs only Node, so a third party can run it after a clone. The two Python scripts
need Playwright and Chromium: install them with `pip install playwright` and
`python -m playwright install chromium`. They embed the real application modules because the build
environment blocked localhost access from the browser. Screenshots are in `proof/`.

`scripts/live-e2e.mjs` drives the **published** site in a real browser against the deployed contract:
connect, claim or already-claimed, purchase, feed history, the independent trait check, and a mobile
viewport. It injects a signer backed by a testnet key in place of a wallet extension, so it proves
the application's own code path rather than a consumer wallet's.

The mock-wallet test uses a **fake wallet and fake RPC** to test UI wiring. It does not execute EVM bytecode. It is separate from the actual testnet acceptance run.

See `docs/TEST_PLAN.md` for the test matrix and the exact remaining live checks. Do not claim a real deployment is complete until those tests have passed.

## Project map

```text
contracts/PollyFeedMarket.sol   A public food market and shared Polly state
src/main.mjs                   Game UI and learning steps
src/market.mjs                 Practice-market rules
src/game.mjs                   Polly's visual rules
src/web3.mjs                   Testnet RPC and wallet calls
src/keccak.mjs                 Hash and ABI helpers
src/styles.css                 Unified game art direction
public/assets/                 The original Polly art and matching new assets
scripts/                       Local server, deploy, replay and test tools
tests/                         Rules and source-alignment checks
docs/                          Product, technical and submission notes
proof/                         Real browser screenshots from the isolated tests
```

## Design choices

We kept the scope small on purpose. There is one shared character, one market contract, one main screen and one path from quote to public proof. Food changes Polly's color and habits through fixed, readable rules. The art is cheerful and consistent. The game is a playful way to learn, and the engineering should stand up to inspection.

The food choices are fictional. This game is not a guide to feeding real birds. No user identity or location profiling is needed.

The artwork and parts of the code were developed with AI assistance, then reviewed and assembled into this project. The focus of the submission is the working interaction and the clear limits of what has been verified.

## Monad integration

**Contract.** `PollyFeedMarket` at `0x3cb03a2bb399916482ffaff524d4dc44debb860d` on Monad Testnet
(chain ID `10143`), deployed at block `70664010`.
Deployment transaction `0x0e2395160c9bc508a7404ed50ef8b3d542691f46426d1aa70fe71a4c4a0ff975`.
Explorer: `https://testnet.monadscan.com/address/0x3cb03a2bb399916482ffaff524d4dc44debb860d`.

**What runs on Monad.** Every reserve, every quote, the price-limit check, the balance check, the
shared parrot state, and the append-only trade commitment. The browser holds no authoritative state.
Read the contract from another client and you get the same market.

**Why Monad.** The lesson depends on settlement being cheap enough that a failed trade costs almost
nothing. On a mainnet with dollar-scale gas, demonstrating a rejected transaction is an expensive
thing to ask a beginner to do twice, and a shared sandbox would cost more to play with than the
lesson is worth. Sub-second finality is the other half: the page waits for a receipt and then proves
the trade against the contract in the same interaction, which only feels like one flow when
confirmation is fast. Testnet plus free play credits makes the bad outcome free while keeping the
pricing, ordering and reverts genuine.

**Honest scope.** The market is a simulation in what it trades, and real in how it settles. There is
no liquidity, no order book and no cash value. The quote rule is a deliberately simplified
constant-product formula for teaching, not a new market algorithm.

## Attribution

Application code, contract, tests, scripts and documentation in this repository are original work
written for Metropolis. The Polly artwork, food illustrations and scene assets were produced for this
project.

Third-party components, none of which are needed to run practice mode:

| Component | Used for | License |
| --- | --- | --- |
| `solc` (npm) | compiling the contract locally | MIT / GPL-3.0 |
| `viem` (npm) | the deploy and live end-to-end scripts | MIT |
| `playwright-core` (npm) | driving a real browser for the live journey | Apache-2.0 |
| Python and Playwright | the two browser acceptance scripts in `scripts/` | Apache-2.0 |

The browser needs no npm install: the front end has zero runtime dependencies and calls the chain
through hand-written ABI selectors and `fetch`.

## Pre-existing work

No part of this submission was taken from another project or repository. The earlier drafts of this
game were built during the hackathon window (1 September to 13 October 2026) and are not published
elsewhere. The published repository history begins when the project was prepared for submission
rather than spanning the whole build window, because the code was assembled locally during that
period and first published at this point. Terms 4.1.1 ask for a commit history covering the build
window; this history does not, and that is stated plainly rather than worked around with backdated
commits.

## AI tooling disclosure

Required by Metropolis terms 4.1.4, which permit AI coding tools and require disclosure.

AI coding assistants were used heavily on this project, and the work they did is recorded in this
repository and in `docs/SUBMISSION_FIELDS_EN.md`:

- Reviewing the market rules and the contract against each other, and writing the source-alignment
  tests that compare them by value rather than by wording.
- Compiling the contract, deploying it to Monad Testnet, and running the acceptance checks
  (claim, successful trade, rejected trade, event replay) against the deployed address.
- Driving the published site in a real browser to verify the user journey end to end, and recording
  the submission demo video from those runs.
- Finding and fixing defects, including the dead explorer links, the `eth_getLogs` range that made
  the public feed history silently empty, the event-replay window that could not run at all, and the
  Windows path bug in the HTTP smoke test.
- Drafting and checking the documentation and the submission copy against the actual code.

The human decisions are the product itself: the parrot, the shared-market premise, the choice to keep
the credits worthless, the positioning of the entry, the funding of the testnet wallet, the recorded
pitch, and every final approval. Two throwaway testnet wallets were generated by tooling and hold no
real funds.

## Documentation index

Metropolis terms 4.1.5 require four documents. Where each lives:

| Required | File |
| --- | --- |
| Project description | this `README.md` ("What players learn", "What actually happens") and `docs/PRODUCT_DESIGN_EN.md` |
| Architecture overview | `docs/TECHNICAL_DESIGN_EN.md` and the "Project map" section here |
| Technology stack | "Design choices" here, plus the stack paragraph in `docs/SUBMISSION_EN.md` |
| Setup and deployment instructions | "Try it in a minute" and "Deploy your own testnet contract" here |

Submission text as entered on the platform, and the acceptance evidence behind it, are archived in
`docs/SUBMISSION_FIELDS_EN.md`.
