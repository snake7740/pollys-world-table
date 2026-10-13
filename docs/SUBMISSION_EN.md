# Metropolis submission

**Project:** Polly's World Table: Feed & Trade Lab

**Track:** Onchain Finance & Trading

**One-line pitch:** Feed Polly. Learn why an on-chain price moves, why a trade may fail, and how anyone can check the result.

## Design and features

Polly's World Table is a friendly trading lesson disguised as a parrot-feeding game. Visitors choose from ten snacks, read a virtual price, set a limit and feed Polly. A trade changes the market reserve and the shared parrot. A second simulated buyer can move the quote first, so players discover how transaction order and price protection work.

The Monad contract uses small, separate food pools with a simplified constant-product formula. Play credits are internal counters with no cash value. The contract checks the accepted price, moves the reserves, updates Polly and writes a public event in one transaction. A failed trade leaves those game changes untouched. The website can check Polly's traits against the contract, and a replay script can audit the public history.

The site guides visitors through eight ideas: public state, credits, price changes, price limits, transaction order, rollback, a shared character and public proof. The same bright Polly illustrations, food assets and tropical art style appear throughout the interface.

A local mode lets anyone learn without a wallet. Live testnet mode is provided in the code and must be configured with a real contract address. The release package does not claim that a real deployment has already been verified. We will share a contract address and live receipt only after completing the live acceptance checks.

The goal is modest. We wanted a playful way to learn something real, with working rules and honest evidence. Hackathons should leave room for curiosity and the pleasure of building.

## User acquisition

We will start with a short video, a public demo and the GitHub repository. Monad builders, learners and small game communities are natural places to share it. The message will be practical: pick a snack, watch the price move, and see what the chain can prove.

Visitors can try the game before setting up a wallet. People who want to go further can join the testnet version and inspect real receipts. We will ask where the flow is confusing, whether players finish a trade, and whether the visual feedback helps them understand the result.

We do not plan paid ads, tokens, speculative incentives or ambitious growth claims. A useful first outcome is a small number of people who enjoy the game and understand one complete on-chain trade better afterward.

## Links to add before final submission

- Demo website: **ADD REAL URL**
- Public repository: **ADD REAL URL**
- Contract on Monad Testnet: **ADD VERIFIED ADDRESS**
- Transaction receipt: **ADD REAL RECEIPT**
- Walkthrough video: **ADD REAL URL**

Do not submit placeholders as live evidence.
