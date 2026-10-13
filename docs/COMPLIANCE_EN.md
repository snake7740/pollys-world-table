# Metropolis compliance record

Every mandatory clause of the Metropolis Rules & Guidelines (last updated 3 September 2026), with the
place it is satisfied and the way that satisfaction was checked. Written so an organizer can audit the
entry without asking us anything.

Verified 14 October 2026. Deadline 14 October 2026, 11:59 GMT+8.

## 4.1 Mandatory requirements

| Clause | Where it is satisfied | How it was verified |
| --- | --- | --- |
| Public GitHub repository | `https://github.com/snake7740/pollys-world-table` | Repository is public; a fresh anonymous clone succeeded |
| - complete source code | `src/`, `contracts/`, `scripts/`, `tests/`, `index.html` | 106 tracked files; the app loads from the clone |
| - README with setup instructions | `README.md` "Try it in a minute", "Deploy your own testnet contract" | `npm run check` run inside a fresh clone with no prior install: 22/22 tests, 55 assets, HTTP allowlist, exit 0 |
| - open source license | `LICENSE` (MIT) | File exists in the clone; `contracts/PollyFeedMarket.sol` carries `SPDX-License-Identifier: MIT` |
| - clear attribution of external code and libraries | `README.md` "Attribution" | Names `solc`, `viem`, `playwright-core`, Python/Playwright with licenses, and states practice mode needs none of them |
| - commit history covering the build window | **Not satisfied, disclosed instead** | The published history begins at submission preparation. `README.md` "Pre-existing work" states this plainly and does not backdate commits |
| Demo video, 3 minutes, publicly accessible | `https://www.youtube.com/watch?v=hj0qxcm6-g4` | Unlisted link opens without login; measured duration 2 min 57 s |
| - demonstrates the product in actual operation | Same video | Frames were extracted and inspected: real quotes, real reserves, real feed history |
| - shows Monad blockchain integration | Same video | Contains a Testnet-mode purchase against the deployed contract and the MonadScan receipt page |
| Monad integration explanation | `README.md` "Monad integration" ("Why Monad"), `docs/SUBMISSION_EN.md` | Text states the dependency on cheap failed trades and fast finality |
| Contract address | `README.md`, `docs/SUBMISSION_EN.md`, form description, form judge instructions | `0x3cb03a2bb399916482ffaff524d4dc44debb860d`; `eth_getCode` returns 3,836 bytes |
| Deployment to Monad mainnet or testnet | Monad Testnet, chain 10143, block 70664010 | Deploy receipt status success; runtime bytecode is a byte-exact suffix of the local build |
| Substantial majority created during the hackathon period | `README.md` "Pre-existing work" | Author confirmation, recorded in the README |
| Pre-existing components identified in the README | `README.md` "Pre-existing work" | Stated there |
| **AI coding tools disclosed in the README** | `README.md` "AI tooling disclosure" | Required by 4.1.4. Lists what tooling did (tests, deployment, acceptance runs, defect fixes, documentation) and what the human decided. Added after an audit found it missing |
| Documentation: project description | `README.md`, `docs/PRODUCT_DESIGN_EN.md` | Present |
| Documentation: architecture overview | `docs/TECHNICAL_DESIGN_EN.md`, `README.md` "Project map" | Present |
| Documentation: technology stack | `README.md` "Design choices", `docs/SUBMISSION_EN.md` | Present |
| Documentation: setup and deployment instructions | `README.md` | Verified by running them in a clean clone |
| Submission made through the hackathon website | This platform | Dashboard step tracker reads **5 / 5 complete, "All steps complete"** |

## 4.2 Deadline

`effectiveDeadline` returned by the platform: `2026-10-14T03:59:00.000Z` = 14 Oct 2026 11:59 GMT+8,
which matches the published "October 13, 2026, 11:59 PM ET".

The terms say a submission may be edited until the deadline and **the version recorded at the deadline
is the version judged**. The platform states in three independent places that no separate submit action
exists: the submission API returns "Judges read the copy you have saved when your deadline passes.
There is nothing to submit."; the save dialog says "This saves your progress. It is not a final
submission."; and the dashboard advanced step 5 to complete on its own once every required field was
saved, changing its action link from "CONTINUE SUBMISSION" to "VIEW SUBMISSION".

## 9.1 Product requirements

| Clause | Evidence |
| --- | --- |
| Functioning prototype, not a mockup, design file or concept deck | Live at `https://snake7740.github.io/pollys-world-table/`, HTTP 200, backed by a deployed contract |
| Code a third party can run by following the README | Fresh clone, no `npm install`, `npm run check` exits 0 |
| Clear statement of the problem and the intended user | Form "Description" and "Go-to-market", which name a specific first user |
| Evidence of the product operating in the demo video | See 4.1 above |

## 9.2 Monad integration requirements

Contract address and transaction hashes are provided; the product uses Monad Testnet; the purpose of
the blockchain is documented in `docs/TECHNICAL_DESIGN_EN.md`; the reason Monad's capabilities are
used is the "Why Monad" section in `README.md`.

## 9.3 Token requirements

**No token is issued or used.** The play credits are internal contract counters: `PollyFeedMarket.sol`
contains no ERC-20, no `transfer`, no `withdraw` and no `payable` function. This was checked by
searching the contract source, not asserted.

## 9.4 Demo video requirements

At most 3 minutes: 2 min 57 s. Publicly accessible: unlisted YouTube link, no login. Shows the product
in actual operation rather than mockups or slides: real interface, real numbers. Shows Monad
interactions: a Testnet purchase and its explorer receipt.

One disclosure is burned into the video itself: the wallet popup was replaced by an injected testnet
signer, while every quote, trade and revert shown is a real Monad Testnet transaction.

## 2 Eligibility

| Clause | State |
| --- | --- |
| 2.4 Team of 1-5 members | 1 member. Platform `missingFields` for the profile is empty and the profile reports `complete: true` |
| 2.5 One project only | One project exists on this account |
| 2.5 One track only | Onchain Finance & Trading |

## Optional items deliberately left empty

| Item | Why |
| --- | --- |
| Sponsor bounties | Optional; each bounty requires answering that sponsor's own questions, and the entry is complete without one |
| Product advertisement (30 s) | Optional and explicitly "not factored into judging" |
| X profile link | Optional |
| "Show this video publicly" (both) | Consent for organizers to feature the videos; does not affect judging |

## Open items

1. The commit-history clause of 4.1.1 cannot be satisfied retrospectively and is disclosed instead.
2. The live **write** path was verified through the interface using an injected signer, not a consumer
   wallet extension. `RELEASE_STATUS.md` records this as the one acceptance item not reproduced.
3. `scripts/live-e2e.mjs` reports 12 of 13 checks; the failing one is a timing flake in the harness
   itself, recorded rather than hidden.

## Clean-clone re-verification

Every check above was repeated against a fresh `git clone` rather than the working copy, because a
claim that only holds on the machine that produced it is not evidence. That re-run found two real
defects the working copy could not show.

**Defect A, fixed: the repository had no `.gitattributes`.** On a Windows machine with
`core.autocrlf=true` a clone checks out CRLF. Solidity embeds a metadata hash of the source bytes, so
that clone compiles to different bytecode than the contract actually deployed, and the published site
no longer matched the repository byte for byte. This is a reproducibility failure against 4.1 and 9.1.
Adding `.gitattributes` (`* text=auto eol=lf`, artwork marked binary) and renormalizing fixed it: all
seven published files then compared byte-identical to the clone, and the deployed runtime code became
a byte-exact suffix of the clone-compiled creation code.

**Defect B, fixed: `scripts/verify-history.mjs` had no retry.** A clean-clone run died after nine
minutes on a single `ECONNRESET`. The walk is hundreds of sequential requests and the judge
instructions tell people to run it, so one dropped connection must not discard the audit. Added
bounded retries with backoff.

Results from the clean clone, in order:

| Step | Result |
| --- | --- |
| `git clone` | OK, 107 tracked files, `LICENSE` present |
| `npm install` | exit 0 |
| `npm run check` | exit 0 - 22/22 tests, 55 assets, HTTP allowlist |
| `npm run compile` | exit 0 - `solc 0.8.37`, 4,076 creation bytes |
| Deployed bytecode vs clone build | runtime 3,836 bytes is a byte-exact suffix of the 4,076-byte creation code |
| Published files vs clone | all 7 byte-identical |
| `node scripts/live-e2e.mjs` | **13 of 13**, exit 0. A purchase clicked in the interface moved the on-chain feed count 9 to 10 |
| `FROM_BLOCK=70664010 node scripts/verify-history.mjs` | exit 0 - "Event replay passed: 10 trades", digest and trade count agree with the contract |

One earlier line in this document reported the live harness at 12 of 13 with a flaky purchase step.
That was wrong in its cause: the flake came from the harness draining its own testnet wallet between
runs, not from the product. With a funded wallet the same run is 13 of 13, and the harness no longer
mints a new wallet per run.

A note on method: one of the failures during this re-verification was in the checker itself, not the
project. The first comparison script fed the `0x`-prefixed `eth_getCode` result into an `endsWith`
against a full `0x`-prefixed creation string, which can never match. Corrected, the check passes. It
is recorded here because a verifier that fails silently is as dangerous as a test that passes falsely.
