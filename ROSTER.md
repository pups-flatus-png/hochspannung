# Founders' Era roster – ability spec and balance check

The design review (GRID_MASTER_Design_Review.pdf, Founders addendum) asks that abilities ship only once trigger, effect, cost or limit, stacking, expiry and phase timing are specified, and seat order has been playtested, and that the final names, logos and rules are reconciled with the project owner. This file records the roster as it ships in v293, the balance data and the owner's decisions (22 Nov 2026, at the end).

## Roster vs. design review

The six companies match the review's roster by name and territory: EcoStar, Kohle & Stahl, Atomix, Petronord, Netzbau, Recycla. **Confirmed as final by the owner.** Emblems are original SVG marks with distinct silhouettes (hexagon, shield, circle, star, diamond, octagon) and line signatures (solid, double, dotted, long dash, short dash, dash-dot).

## Rules that apply to every ability

- **Trigger:** passive. A discount applies at the moment of the matching payment: a plant price at auction (on the price actually paid), a resource purchase, a connection or a city slot.
- **Stacking:** company and strategy effects add together. A plant or fuel price never drops below 1 €.
- **Step change:** each company has a Step I version and a Step II+ version. At Step II and again at Step III, every player takes one upgrade: soften the strategy's drawback by 1 € (`m`) or strengthen its bonus by 1 € (`b`).
- **Expiry:** none. Abilities last the whole game, except Netzbau's free line, which is once per round.
- **Rivals:** every company's effect is shown to rivals as a one-line "watch" hint.

## Companies

| Company | Step I | Step II and later | Plays in phase |
|---|---|---|---|
| EcoStar | Eco plants −3 € | Eco plants −3 €, fusion plants −5 € | Auction |
| Kohle & Stahl | Coal and hybrid plants store 3× fuel | 3× storage, coal −2 € per purchase | Resources |
| Atomix | Uranium plants (and mines) −6 €, uranium −1 € per unit | Uranium plants −7 €, uranium −2 € per unit | Auction, Resources |
| Petronord | Oil −1 € per purchase | Oil −1 € per purchase, oil plants −2 € | Resources (Auction from Step II) |
| Netzbau | One connection costing up to 3 € is free each round (2 € until v292) | Same, plus every connection −1 € | Build |
| Recycla | Garbage plants −2 € | Garbage plants −3 €, garbage −2 € per purchase | Auction (Resources from Step II) |

"Per purchase" is once per buying action of that resource; "per unit" is for each unit bought.

## Strategies

| Strategy | Start money | Bonus | Drawback |
|---|---|---|---|
| Investor | 52 € | Plants −2 € | Fuel +1 € per purchase |
| Logistics | 50 € | Fuel −1 € per purchase | Plants +1 € |
| Expansion | 46 € | Every connection −2 € | City slots +1 € |
| Municipal | 50 € | First city slot costs 9 € | Plants +1 € |
| Conglomerate | 52 € | None | None |
| Pioneer | 50 € | Second city slot already in Step I, plants −1 € | None |

## Balance check (computer players)

Method: 4 AI players ("normal"), Germany, standard deck. Every 4-of-6 matchup, rotated through all four seats, 20 repetitions = 1,200 games per run. Fair share is 25%. Rerun with `python3 tools/sim_companies.py 20 <build>` and `python3 tools/sim_strategies.py 20 <build>`.

**Precision:** repeated runs differ by up to 4 points for the same company, more than the binomial 1.5 points per run suggests, so read single runs with care and pool several. The figures below pool all runs made.

| Run | Win rates |
|---|---|
| Companies, Netzbau 2 € (3 runs, 3,600 games) | EcoStar 24.0%, Kohle & Stahl 24.1%, Atomix 27.7%, Petronord 25.3%, Netzbau 25.1%, Recycla 23.9% |
| Netzbau at 3 € (2 runs) / at 4 € (2 runs) | Netzbau 25.8% / 28.8% |
| Companies, Netzbau 3 € (2 runs, v293) | EcoStar 24.4%, Kohle & Stahl 21.9%, Atomix 28.2%, Petronord 26.0%, Netzbau 25.8%, Recycla 23.7% |
| Control: same games with no companies (labels only) | 22.8–26.8% |
| Strategies (companies rotate underneath) | Logistics 29.5%, Investor 27.1%, Conglomerate 26.0%, Municipal 24.4%, Expansion 22.6%, Pioneer 20.4% |
| Seat (company run) | seat 1 25.9%, seat 2 24.9%, seat 3 24.9%, seat 4 24.3% |

Reading:
- **Companies are close but not even:** Atomix is consistently a little strong (about 28%) and Kohle & Stahl a little weak (22–24%); the others sit near 25%. The no-company control spans 22.8–26.8%, so only Atomix stands out clearly.
- **Strategies are not:** Logistics beats Pioneer by 9 points, about twice the run-to-run spread (one run so far). Cheap fuel compounds over a game; Pioneer's early second slot does not pay off for the computer players.
- **Seat order is fair** in Founders.
- **Netzbau:** 3 € keeps it at fair share; 4 € makes it the strongest company.
- **Limit:** the computer players don't plan around their abilities (for example, Kohle & Stahl doesn't stockpile on purpose), so human play can differ. Real playtests remain the final word.

## Decisions (owner, 22 Nov 2026)

1. **Roster:** confirmed as final.
2. **Strategies:** kept as they are.
3. **Netzbau's free line:** raised from up to 2 € to up to 3 € (v293). At 2 € it never triggered on Germany, Europe or Spain; at 3 € every map has at least one qualifying connection (133 across all 19 maps), and the simulation keeps Netzbau at fair share. 4 € was tested and made Netzbau too strong.
4. **Human playtest:** recommended before calling the balance final. The simulation can't tell whether abilities feel distinct, and the computer players don't plan around them.

## Watch list

- Atomix about 3 points above fair share and Kohle & Stahl about 2 below, under computer play. Recheck after the human playtest before changing anything.
