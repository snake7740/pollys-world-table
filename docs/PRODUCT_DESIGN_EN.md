# Product design

## One small question

Can feeding a friendly parrot help someone understand what a trade does on a blockchain?

Polly's World Table starts with one thing anyone can enjoy. Pick a snack and watch Polly react. A quiet market sits behind that choice. It offers a public quote, checks a price limit, and changes the shared bird only when the trade succeeds.

## The experience

Polly is one shared parrot. She has ten illustrated snack choices, several feather palettes, different expressions and small habits. Her look comes from the most recent meals, with newer meals having more influence. Nobody picks her color through a secret admin panel.

Practice mode works without a wallet. It teaches the steps with play credits and a simulated market. When a second buyer acts first, the price can move. The player can try the old quote, see a failed purchase, and set a fresh limit. Testnet mode uses the same visible flow through a real contract call.

The main screen has Polly on the left, a snack market in the center and eight short learning cards on the right. The bottom area shows recent activity. The player should be able to learn by clicking, with the explanation close to the action that produced it.

## The eight ideas

1. **Public state.** Anyone can read the market's rules and current values.
2. **Play credits.** A wallet has an internal balance for this one game.
3. **Changing prices.** A small reserve pool reacts to buying.
4. **A price limit.** A quoted price is not a promise about the future.
5. **Trade order.** Another transaction can be executed first.
6. **All or nothing.** A failed purchase leaves game balances and Polly unchanged.
7. **Shared Polly.** A successful meal adds to a common public memory.
8. **Public proof.** A receipt and events can be checked independently.

## Visual rules

Polly must retain the original rounded shape, bright cyan and orange feathers, shiny large eyes, charcoal beak and expressive wings. Feather palettes change within this character family. The food art uses the same polished, playful rendering. The island, wood, leaves, badges and panels use one coordinated tropical game style.

A flat icon pack, unrelated cartoon bird, generic stock art or mismatched character cannot replace these assets. `public/assets/reference/` stores the approved art sheets and game references. The `ui` folder has a matching background and eight lesson badges. Every image path resolves to an actual bundled file.

## Boundaries

There are no financial assets, trades with real value, leaderboards, NFT sales or speculative rewards. A small game should feel complete before it grows. The player's enjoyment matters even when no prize is won.
