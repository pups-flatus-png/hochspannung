# Founders' Era roster – ability spec and balance check

The design review (GRID_MASTER_Design_Review.pdf, Founders addendum) asks that abilities ship only once trigger, effect, cost or limit, stacking, expiry and phase timing are specified, and seat order has been playtested, and that the final names, logos and rules are reconciled with the project owner. This file records the roster as it ships in v292 and the first balance data. **Decisions for the owner are at the end.**

## Roster vs. design review

The six companies match the review's roster by name and territory: EcoStar, Kohle & Stahl, Atomix, Petronord, Netzbau, Recycla. Emblems are original SVG marks with distinct silhouettes (hexagon, shield, circle, star, diamond, octagon) and line signatures (solid, double, dotted, long dash, short dash, dash-dot).

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
| Netzbau | One connection costing up to 2 € is free each round | Same, plus every connection −1 € | Build |
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

## Balance check (v292, computer players)

Method: 4 AI players ("normal"), Germany, standard deck. Every 4-of-6 matchup, rotated through all four seats, 20 repetitions = 1,200 games per run. Fair share is 25%. With 800 games per company or strategy, one standard deviation is about 1.5 points. Rerun with `python3 tools/sim_companies.py 20 <build>` and `python3 tools/sim_strategies.py 20 <build>`.

| Run | Win rates |
|---|---|
| Companies (all players on Conglomerate) | EcoStar 24.4%, Kohle & Stahl 25.1%, Atomix 25.3%, Petronord 24.6%, Netzbau 25.8%, Recycla 24.9% |
| Control: same games with no companies (labels only) | 22.8–26.8% |
| Strategies (companies rotate underneath) | Logistics 29.5%, Investor 27.1%, Conglomerate 26.0%, Municipal 24.4%, Expansion 22.6%, Pioneer 20.4% |
| Seat (company run) | seat 1 25.9%, seat 2 24.9%, seat 3 24.9%, seat 4 24.3% |

Reading:
- **Companies are even** under computer play: every company sits within one standard deviation of 25%, no wider than the no-company control.
- **Strategies are not:** Logistics beats Pioneer by 9 points, about four standard deviations. Cheap fuel compounds over a game; Pioneer's early second slot does not pay off for the computer players.
- **Seat order is fair** in Founders.
- **Limit:** the computer players don't plan around their abilities (for example, Kohle & Stahl doesn't stockpile on purpose), so human play can differ. Real playtests remain the final word.

## Decisions for the owner

1. **Roster:** confirm the six names, emblems and territories as final, or name changes.
2. **Strategies:** pick one:
   - keep as is;
   - nudge Logistics (fuel −1 € only from the second purchase each round) and Pioneer (plants −2 €);
   - or rerun with stronger computer players first.
3. **Netzbau's free line:** connections of 2 € or less don't exist on Germany, Europe or Spain, so the Step I ability never triggers there. Across all 19 maps, only 69 of 1,534 connections qualify; the Benelux and Québec maps have the most (9 each). Raising the limit to 4 € would give Germany 6 qualifying lines and Italy 25. Options: "up to 4 €", "the cheapest connection each round is free", or keep it with map-specific wording. Netzbau still reached 25.8% in the simulation, mostly through its Step II −1 € per connection.
4. **Human playtest:** schedule a few Founders games with people. The simulation can't test whether abilities feel distinct.
