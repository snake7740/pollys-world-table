# Submission field content — Polly's World Table

**Purpose:** single source of truth for every string entered into
`https://hackathon.monad.xyz/project?tab=submission`.
Anything saved into the form must appear here first, so the submitted text is reviewable and
reproducible after the deadline.

**Deadline (read from the logged-in site, not assumed):** 14 Oct 2026, 11:59 GMT+8.
**Track:** Onchain Finance & Trading — `$30,000`, split across 3 winners.
**Prize page rule:** track selections stay editable until the submission deadline.

---

## Official judging weights (verbatim from `/tracks/onchain-finance`)

| Weight | Criterion | What the official text asks for |
| --- | --- | --- |
| **25%** | Founder & Market Readiness | "does the team understand who the trader, protocol, or counterparty is and why this market doesn't already exist? Can they name a specific first user beyond 'crypto traders'?" |
| 20% | Technical Execution | "does the trading/market mechanism work end-to-end onchain? Real settlement and pricing/matching logic, **not a UI mockup over static data**." |
| 20% | Design & Craft | "is the trading experience trustworthy and legible? Clear pricing, clear risk disclosure, an interface a trader would actually trust with capital." |
| 20% | Traction & Path Forward | "any evidence of real usage or testing (**even simulated volume or a handful of test trades**), and a specific next step." |
| 15% | Originality & Track Insight | "a genuinely new asset primitive or market structure ... or is it a faster clone of an existing DeFi product?" |

**Consequence for time allocation:** the largest single weight is the market/first-user answer, which
costs writing time, not engineering time. The go-to-market field is therefore not filler.

**Track fit anchor (official "Suggested starting points"):**
- `#06` "Embedded trading experiences inside wallets, **games**, or other apps that aren't trading-native"
- `#05` "Mobile-first or simplified trading experiences built for a specific segment (**new traders**, ...)"

The submission is positioned against `#06` + `#05`. This is the track's own listed angle, not a rebrand.

---

## Official deliverables list (verbatim requirements)

| Deliverable | Official rule | Status |
| --- | --- | --- |
| Project logo | "JPG, JPEG, PNG, or WEBP (maximum size 3MB)" — the form field itself says **max 2 MB**, at least 500 px, up to 2000 × 2000 px | Ready: `Downloads/波莉的世界餐桌.png`, PNG **1254 × 1254**, **1.82 MB** → passes both limits |
| Public GitHub repository | "fully accessible by metropolis@hackathon.monad.xyz" | Blocked on GitHub authorisation |
| Technical demo video | max 3 min, "must show the live working product, not slides or a code walkthrough" | Needs the live product first |
| Pitch video | max 2 min, team + problem + why | Human-only |
| Live product link | "deployed on Monad Mainnet or Testnet, **accompanied by clear access instructions and any necessary test login credentials for judges**" | Blocked on contract deployment |
| Judge access instructions | marked *optional* in the form, but **required by the deliverables line above** | Treat as required |
| Product advertisement | optional, max 30 s, "not factored into judging" | Skip |

---

## Field: Project name

```
Polly's World Table
```

Kept as-is (19 / 120 characters). The sandbox positioning belongs in the one-line description, not a
name change that would diverge from the repo, the UI header, and the logo.

---

## Field: One-line description  (limit 200 characters)

**Current saved value — replace it.** It reads `Polly's World Table | Monad Metropolis: Social,
Attention & Culture. ...`, which names a *different* track than the one selected, and spends its
budget repeating the project name.

```
A playable onchain trading sandbox on Monad Testnet. First-time traders feel live quotes, price impact, a rejected limit, and atomic settlement in one shared market. No capital at risk.
```

Length: 185 characters (measured on the live form field after saving, not estimated).

---

## Field: Description  (limit 8,000 characters)

`{{CONTRACT}}`, `{{DEPLOY_BLOCK}}`, `{{LIVE_URL}}`, `{{REPO}}` are filled after deployment.
Do not save this field with placeholders still visible.

```
Polly's World Table is a playable onchain trading sandbox. One shared food market, one parrot, and the full life of a trade: a live quote, a price limit you choose, a settlement that either changes everything or changes nothing, and a public record anyone can re-check.

WHY IT EXISTS
The track asks for trading experiences that could not exist without fast settlement (suggested starting points #06 and #05). A first-time trader does not learn market mechanics from an explainer; they learn it when a quote moves under them and their limit refuses a bad fill. Building that as a trading product means real capital at risk for a lesson worth cents. Building it as a game makes the lesson repeatable. So the market is real and the money is not: pricing, ordering, protection and settlement all run in a contract, while the credits carry no cash value by design.

THE MECHANISM
One Solidity contract, PollyFeedMarket, holds ten food pools with fixed starting reserves. The quote for one portion is ceil(creditReserve / (foodReserve - 1)). Every fill adds the paid credits to that pool and removes one portion, so the next quote is a consequence of the last trade rather than a display value. A buy carries a maximum acceptable price; if the pool moved past it, the transaction reverts with MaxPriceExceeded and no state changes. A successful trade updates balance, reserves, portions, the shared parrot state, a chained history commitment, and a TradeExecuted event in one atomic step. Credits are granted once per address, are non-transferable, and cannot be withdrawn or redeemed. There is no ERC-20, no custody, no payout, and no cash value anywhere in the system.

THE SHARED STATE
Everyone feeds the same parrot. Its feather colour, mood and habit come from a weighted ten-item short memory of recent trades, so the newest buyer has the most say and an older player can be overwritten. The same rule is computed twice: once by the contract in getPolly(), and once independently in the browser. The page only shows a verified badge when both agree at the same block height. A pretty animation is treated as a claim, not as evidence.

WHAT A JUDGES CAN CHECK
- Contract source, deployed address and transaction receipts on MonadScan.
- The public event log, replayed and re-hashed by scripts/verify-history.mjs, which rebuilds the commitment chain from TradeExecuted events and compares it to the contract's stored value.
- 22 local tests that compare the browser rules against the contract by value rather than by wording: the quote formula across the whole reserve space, the credit grant, both starting pools, the three trait tables, and the short-memory tie-break across every feed ordering up to length four. A changed constant, formula or trait table on either side fails the suite.
- The hand-written ABI in the front end checked against the compiled artifact: six function selectors, the 44 return words of getMarket(), and the indexed layout of TradeExecuted.
- The bundled Keccak implementation and the commitment packing compared against viem.

EIGHT DISCOVERIES, IN ORDER
See a shared market · claim play credits · watch a price move · set your own limit · see who trades first · see success or rollback · watch the parrot change · check the public proof.

HONEST LIMITS
This is a sandbox, not a venue. There is no real liquidity, no order book, no custody and no yield; the pricing rule is a deliberately simplified constant-product quote for teaching, and we do not claim a new market algorithm. Testnet trades cost testnet MON for gas only. The market is shared, so after publication the numbers a visitor sees depend on who traded before them.

Stack: Solidity 0.8.37 contract; dependency-free ES modules in the browser; hand-written ABI and JSON-RPC calls; a local Node static server with a path allowlist. No backend service, no accounts, no analytics.

LIVE EVIDENCE
Contract: {{CONTRACT}} (deployed at block {{DEPLOY_BLOCK}})
Play it: {{LIVE_URL}}
Code: {{REPO}}
```

---

## Field: Go-to-market and user acquisition  (limit 8,000 characters)

This is the **25%** criterion. It names a specific first user instead of a segment.

```
FIRST USER, NAMED
The first user is not "crypto traders". It is the person in the first five minutes of a self-custody wallet's life, and the specific counterparty we would sign first is a wallet or bridge team that loses most of its new users at the first transaction screen. Their measured problem is activation, not trading volume. The unit they need to move is "completed first onchain transaction", and the thing that blocks it is the fear of signing something whose price and failure mode you cannot predict.

WHY THIS MARKET DOES NOT ALREADY EXIST
Trading simulators exist and are aimed at people who already want to trade; they teach order types, not the feeling of a settlement that can refuse you. Wallet onboarding flows exist and compress the decision into one "Confirm" button, which is exactly where the fear is created. The gap between them is a place to make a bad outcome free: a market with real pricing, real limits and real reverts, where the only thing you can lose is a pretend credit. It is not a faster version of an existing product because it is not a trading product at all — it is the pre-trading layer, and it only became cheap enough to run on a public chain at Monad's settlement cost.

HOW PEOPLE ARRIVE
1. Embedded, not standalone. The product is designed to be dropped into someone else's first-run flow as a link or iframe, so the host keeps the user and we supply the one lesson they cannot get from a tooltip.
2. Event and workshop surface. A booth or a 10-minute workshop where the shared parrot is projected: the audience watches the bird change colour because a named person in the room traded. The public ordering is the demonstration, and it is the part a slide cannot fake.
3. Written technical distribution. The verifiable-history mechanism (event replay, commitment chain, independent trait recomputation) is publishable as an engineering note, and it is the part that makes developers forward it rather than just like it.
4. Hackathon and ecosystem listing. Metropolis project directory, MonadScan contract listing, and the developer portal guides that already link here for deployment steps.

THE ACTIVATION LOOP
Open the link → see the real shared market with no wallet and no sign-in → play mode lets a visitor claim, quote, set a limit and get a rollback for free → the conversion moment is being shown that the parrot they just changed is the same parrot everyone else is looking at → connect a wallet, claim 500 testnet credits, trade once → the page proves the trade against the contract → the result is a screenshot of a bird whose colours they caused, which is the share artifact.

WHAT WE WOULD MEASURE
Practice-to-wallet conversion, completed first trade per visitor, rollback experienced per visitor (the lesson people report learning), and repeat feeds inside 24 hours. A share-back rate from the receipt view. None of these are vanity metrics for a trading product; they are the metrics of the host that embeds us.

BUSINESS SHAPE
Not a fee business. The plausible commercial form is a licensed onboarding module or a co-branded first-trade experience, priced per activation to the wallet or bridge team, because that is who has the measurable problem and the budget. A consumer app would have to out-spend exchanges on attention and would lose.

HONEST CURRENT STAGE
There is no user growth and no paying customer. We are not going to invent a market-size number for a sandbox. The concrete next step we can commit to is: publish the testnet build, run it as the live demo at a named Metropolis event, and take the verifiable-history write-up to two wallet onboarding teams as a pilot offer. Traction evidence in this submission is the onchain trades recorded against our own contract, and we present them as exactly that.
```

---

## Field: Judge access instructions  (optional in form, required by deliverables)

```
No account, password or API key is needed.

1. Open {{LIVE_URL}}. The page loads in Practice mode: the market is live and no wallet is required.
2. To trade on-chain, click "Monad Testnet" and connect a wallet on chain ID 10143 (RPC https://testnet-rpc.monad.xyz). Testnet MON for gas comes from https://testnet.monad.xyz; the game itself never asks for or holds funds.
3. Click "Get 500 play credits" once per wallet. Credits are non-transferable and cannot be withdrawn.
4. Pick a snack, set a maximum price, and buy. The page then compares its own calculation of the parrot against getPolly() at the same block and shows "The contract and this page agree" only when they match.
5. Contract: {{CONTRACT}} · deployed at block {{DEPLOY_BLOCK}} · receipts: https://testnet.monadscan.com/address/{{CONTRACT}}
6. To re-check the whole trade history yourself, run: FROM_BLOCK={{DEPLOY_BLOCK}} npm run audit   (it replays TradeExecuted events and rebuilds the on-chain commitment).
7. Local verification: npm test (22 tests), node scripts/validate-assets.mjs, node scripts/http-smoke.mjs, npm run compile.

The market is shared, so quotes move as other judges trade. That is intended behaviour, not a fault.
```

---

## Field: URLs

| Field | Value | State |
| --- | --- | --- |
| GitHub repository | `https://github.com/snake7740/pollys-world-table` | **Saved** — public, 100 files, branch `main` |
| Live product | `https://snake7740.github.io/pollys-world-table/` | **Saved** — GitHub Pages, branch `gh-pages`, 70 shipped files |
| Technical demo video | `<host url>` | Open — needs the deployed contract first |
| Pitch video | `<host url>` | Open — human-only |
| Judge access instructions | see block above | Open — needs the contract address |
| Show video publicly ×2 | left unchecked | Consent decision, not required |

---

## What is actually saved on the platform right now

Verified by reloading the page and reading the fields back from the server, not from client state.

| Field | Characters | Server state |
| --- | --- | --- |
| One-line description | 185 / 200 | saved |
| Description | 3,872 / 8,000 | saved |
| Go-to-market | 3,784 / 8,000 | saved |
| GitHub repository | 47 | saved |
| Live product | 47 | saved |
| Project logo | 1254 × 1254 PNG, 1.82 MB | uploaded |
| Judge access instructions | 0 / 8,000 | empty |
| Technical demo video | — | empty |
| Pitch video | — | empty |

Submission checklist: **4 of 5 complete**. The only remaining "required information missing"
entry is the two videos. **SUBMIT has not been pressed.**

### Deployment facts behind the live link

- Pages source: branch `gh-pages`, path `/`, build type `legacy`.
- `src/main.mjs` is served as `text/javascript`, so the ES module graph loads; `config.js` as
  `application/javascript`; CSS and HTML correct.
- The served `src/main.mjs` md5 equals the local file, so what runs in a judge's browser is
  byte-identical to what was tested.
- The published branch carries only the 70 shipped files. `contracts/`, `scripts/`, `tests/`,
  `docs/`, `proof/`, `README.md` and `RELEASE_STATUS.md` exist only on `main` and are not served.
- `config.js` on `gh-pages` still has an empty `contractAddress`, so the live site currently opens in
  Practice mode. **After the contract is deployed, `config.js` must be updated and re-pushed to
  `gh-pages`, or the "Live product" link will not satisfy "must run on Monad Testnet".**

### Live verification of the published URL

Performed in a real browser against `https://snake7740.github.io/pollys-world-table/`, not against a
local copy. A claim, a food selection, a price limit and one purchase were executed through the page's
own buttons. Resulting state read back from the rendered page:

```
Your credits: 489 CR        (500 grant minus the 11 CR quote)
Snacks left:  29            (30 minus one sold)
1 confirmed feeds
Price now:    12 CR         (the quote rose because of this fill)
Feather colors: Leaf · Mood: Curious · Habit: Head tilt
Console errors: none
```

The three trait names match `FOODS[0]` in `src/game.mjs` (palette 1, mood 1, habit 1) and the same
three indices in the contract's `_paletteFor`, `_moodFor` and `_habitFor`, so the published site and
the contract agree on the rule that the submission claims they share.

### Remaining work, in order

1. Deploy `PollyFeedMarket.sol` from Remix with compiler **0.8.37**, optimizer on, 200 runs.
2. Write the address into `config.js`, re-push `gh-pages`, re-verify the live site loads in Testnet mode.
3. One successful trade and one stale-limit rejection; record address, block, and both transaction hashes.
4. Fill Judge access instructions and append the live-evidence lines to the Description.
5. Record the two videos.
6. Only then: SUBMIT.

---

## Deployment decision: where the service runs

**Answer: GitHub Pages, serving a filtered `gh-pages` branch.** Reasons measured, not assumed:

- The app is genuinely static: `index.html` loads `./src/styles.css`, `./config.js`, `./src/main.mjs`,
  and every asset path is relative (`./public/assets/...`), so a project page under `/<repo>/` works
  without a base-path change.
- The Node server exists only to allowlist local paths. On Pages the sensitive files are simply never
  uploaded, so the allowlist has nothing to protect.
- No cold start. Render's free tier sleeps and would make a judge wait on first click; Pages does not.
- One credential covers both required fields (repository and live link).
- Pages on a **private** repository needs a paid plan, so the repository should be **public** — which is
  also what the deliverables line asks for ("Public GitHub Repository").

Rejected alternatives: Render running `npm start` (cold start, second account); Vercel (needs its own
token, same static result); Cloudflare Pages (API unreachable from this machine in testing).

## Deployment wallet

A throwaway testnet-only key was generated with `generatePrivateKey()` and written to `.env`
(git-ignored, untracked, never printed). Public address:

```
0xD18a8D95C510d694a94Dad4a221ab6471e9d79B4
```

Balance at creation: 0 MON. Deployment needs about 0.44 MON (4,394,168 gas at a 100 Gwei base fee),
and the follow-up test trades add roughly 0.1 MON, so at least 1 MON is claimed from
`https://faucet.monad.xyz/`. The faucet rate-limits scripted requests with HTTP 429, so the claim is
done by hand in a browser.

## On-chain acceptance evidence (Monad Testnet, 13 Oct 2026)

Contract `0x3cb03a2bb399916482ffaff524d4dc44debb860d`, deployed at block **70664010**,
deploy tx `0x0e2395160c9bc508a7404ed50ef8b3d542691f46426d1aa70fe71a4c4a0ff975` (status success,
1,251,281 gas).

| Check | Result |
| --- | --- |
| Deployed runtime code vs local build | runtime 3,836 bytes is a byte-exact suffix of the 4,076-byte creation code |
| Fresh state | reserves 300/330/315, portions 30, totalFeeds 0, memoryLength 0, commitment all zeros, `getPolly()` (0,0,0) |
| `claimCredits()` | success, `credits(address)` = 500 |
| First buy, food 0 at limit 11 | success, 111,440 gas; reserves 300->311, portions 30->29, totalFeeds 1, commitment `0xb36ccf5b...`, `getPolly()` -> (1,1,1) |
| Forced failing buy, limit below price | **mined on chain with status 0x0**, tx `0x3c0e346d46041cbbbf45c404a13dfaf0991649570cb6641b95a412ad424a5f3e`; state afterwards identical to before |
| Second `claimCredits()` | reverted |
| Two-wallet race | rival traded twice first, price 13 -> 14; the saved limit of 13 was rejected and its credits stayed 466 |
| Event replay audit | `FROM_BLOCK=70664010 node scripts/verify-history.mjs` -> "1 trades ... event history, transaction order, trade count and on-chain digest all agree" |
| Published site in Testnet mode | shows `2 confirmed feeds`, real feed history row with a working MonadScan link, agreement badge true, zero console errors |

Explorer links verified reachable (HTTP 200): the transaction page and the contract page on
`testnet.monadscan.com`.

### Defects found and fixed during this acceptance run

1. `testnet.monadvision.com` fails with a client-side application error, yet it was the default
   explorer in `config.js`, `config.example.js` and three fallbacks in `src/web3.mjs`. Every receipt
   and contract link was dead. Switched to `testnet.monadscan.com`, which uses the same
   `/tx/<hash>` and `/address/<addr>` scheme.
2. `src/web3.mjs` asked for a 1,500-block `eth_getLogs` window. Monad's public RPC rejects anything
   wider than 100 blocks with HTTP 413, so the call always failed, and `main.mjs` swallowed it with
   `.catch(()=>[])`. The public feed history was therefore permanently empty in Testnet mode. Now
   scans backwards in 100-block slices, stops at eight trades, reports a read failure instead of
   hiding it, and the empty-state copy describes the scanned window rather than claiming no trades
   ever happened.
3. `scripts/verify-history.mjs` used 500-block windows and could not run at all against this RPC.
   Reduced to 100.
4. `index.html` declared no icon, so every load logged a `/favicon.ico` 404. Added a 64px PNG.
5. `scripts/http-smoke.mjs` passed a `file://` pathname as a child-process working directory, so it
   failed on Windows with a misleading `spawn ... ENOENT`.

---

## Pitch video script (final, as recorded by the author)

Target: under 2 minutes. Introduces the team, the problem, and why this is being built.

```
Hi. I'm Darian.

I'm a solo developer. I enjoy exploring little ideas after work, especially the ones that
sound a bit unusual.

I entered Metropolis because I wanted to finish one small thing completely.
Not another pitch deck.
Not a video of something that doesn't exist.
Something I could deploy, break, and prove.

I chose the Onchain Finance and Trading track.

Here's where it started.

I kept reading about price impact, slippage limits, and failed transactions.
I understood the words. But I didn't feel them.
And most explanations seemed to assume you already had a wallet, some tokens, and the
confidence to make a trade.

So I asked a different question.

What if your first experience with these ideas had no real money at risk?

Now, I happen to have a parrot at home.
And when I needed a character for this experiment, I thought, why not a parrot?

That's how Polly's World Table began.

You pick a snack.
You see its price.
You set the most you're willing to pay.
Then you buy it and feed Polly.

The next player might see a different price, because everyone trades against the same pool.

Behind the game is a Solidity contract.
It calculates quotes, checks price limits, and updates the shared market.
If the price moves beyond your limit, the trade reverts. Your practice credits stay untouched.

The credits have no cash value. The market is a simulation, but the contract rules and
transactions are real.

Every confirmed trade leaves a public record you can check.

And there's something else I like about Polly.

Nobody gets a private copy. We all feed the same bird.
Its feathers, mood, and habits change with the last ten meals.
Someone you've never met can change what you see when you come back.

I built this for the feeling I was missing.
If one new trader walks away understanding why a price moves, why a trade fails, and how to
verify what happened, then this little experiment was worth building.

Thanks.
```

### Language requirement, checked against the official terms

The rules document has no clause requiring any particular language for the pitch or demo
video. Section 13.8 "Language" governs the Terms themselves: "These Terms are provided in
English. Any translations are for convenience only; the English version controls."

What section 9.4 does require of the demo video is: at most 3 minutes, publicly accessible via
YouTube, Loom, Vimeo or similar, showing the product in actual operation rather than mockups or
slides, and showing Monad blockchain interactions.

The submission form fields are English, and the judging panel is English-speaking, so all
submitted copy and both videos are in English.

### Consistency rule for every other document

The sentence "the market is a simulation, but the contract rules and transactions are real" is
the agreed wording. `README.md`, `RELEASE_STATUS.md`, `docs/SUBMISSION_EN.md`,
`docs/TECHNICAL_DESIGN_EN.md` and the form text must all say that and nothing stronger: no
claim of a new market algorithm, no claim of liquidity, and no claim of real financial use.
