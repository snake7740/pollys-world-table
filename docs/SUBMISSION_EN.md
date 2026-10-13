# Metropolis submission

**Project:** Polly's World Table: Feed & Trade Lab

**Track:** Onchain Finance & Trading

**One-line pitch:** A playable onchain trading sandbox on Monad Testnet. First-time traders feel
live quotes, price impact, a rejected limit, and atomic settlement in one shared market. No capital
at risk.

## Design and features

Polly's World Table is a trading lesson that happens to be a game about feeding a parrot. Visitors
choose from ten snacks, read a live price, set the most they will pay, and feed Polly. A trade
changes the market reserve and the shared parrot. Another buyer can move the quote first, so players
discover how transaction order and price protection work by being on the receiving end of it.

The Monad contract holds small, separate food pools and uses a simplified constant-product formula.
Play credits are internal counters with no cash value. The contract checks the accepted price, moves
the reserves, updates Polly and writes a public event in one transaction. A failed trade leaves those
game changes untouched. The website checks Polly's traits against the contract at the same block, and
a replay script audits the public history from the event log.

The site guides visitors through eight ideas: public state, credits, price changes, price limits,
transaction order, rollback, a shared character, and public proof.

A local mode lets anyone learn without a wallet. Testnet mode is live: the market, the credits and
the history all come from the deployed contract.

## Live evidence

| Item | Value |
| --- | --- |
| Play it | `https://snake7740.github.io/pollys-world-table/` |
| Source | `https://github.com/snake7740/pollys-world-table` |
| Contract | `0x3cb03a2bb399916482ffaff524d4dc44debb860d` (Monad Testnet, chain `10143`) |
| Deployed at block | `70664010` |
| Deploy transaction | `0x0e2395160c9bc508a7404ed50ef8b3d542691f46426d1aa70fe71a4c4a0ff975` |
| Rejected trade, mined as a revert | `0x3c0e346d46041cbbbf45c404a13dfaf0991649570cb6641b95a412ad424a5f3e` |
| Explorer | `https://testnet.monadscan.com/address/0x3cb03a2bb399916482ffaff524d4dc44debb860d` |

What was confirmed against the chain, and how, is recorded in `RELEASE_STATUS.md`. The event replay
in `scripts/verify-history.mjs` re-derives the commitment chain from the public logs and agrees with
the contract on both digest and trade count.

## Why Monad

The lesson depends on settlement being cheap enough that a failed trade costs almost nothing. On a
mainnet with dollar-scale gas, demonstrating a rejected transaction is an expensive thing to ask a
beginner to do twice. Sub-second finality is the other half: the page waits for a receipt and then
proves the trade against the contract inside the same interaction, which only feels like one flow
when confirmation is fast.

## User acquisition

The first user is not "crypto traders". It is the person in the first five minutes of a
self-custody wallet's life, and the first counterparty we would sign is a wallet or bridge team that
loses new users at the first transaction screen. Their measured problem is activation, not trading
volume, and what blocks it is the fear of signing something whose price and failure mode you cannot
predict.

The product is designed to be embedded in someone else's first-run flow rather than to compete for
attention as a consumer app. Secondary channels are event and workshop demos, where the shared
parrot is projected and the audience watches it change because a named person in the room traded,
and written technical distribution around the verifiable-history mechanism.

We measure practice-to-wallet conversion, completed first trade per visitor, rollback experienced per
visitor, and repeat feeds inside 24 hours. There is no user growth and no paying customer yet, and we
are not inventing a market-size number for a sandbox.

## Honest limits

This is a sandbox, not a venue. There is no real liquidity, no order book, no custody and no yield.
The pricing rule is a deliberately simplified constant-product quote for teaching, and we do not
claim a new market algorithm. The market is shared, so after publication the numbers a visitor sees
depend on who traded before them.
