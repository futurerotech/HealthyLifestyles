/** @jsxImportSource preact */
// Phase 5 Candidate 1: quantity-aware grocery list, BLS-based cost estimate, household size
// and optional weekly budget for the existing meal-plan generator. Estimates only; the price
// source and month are shown. Everything stays in memory in the browser; nothing is stored or sent.
import { useMemo, useState } from 'preact/hooks';
import { groceryCost, cheaperSwaps, clampHousehold, formatAmount } from '../lib/grocery-cost.ts';
import type { PlannedDay } from '../lib/mealplan';
import type { Recipe } from '../data/recipes';

const usd = (n: number) => `$${n.toFixed(2)}`;
const monthName = (p: string) => { const [y, m] = p.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };

export default function GroceryBudget({ days, pool, recipes }: { days: PlannedDay[]; pool: Recipe[]; recipes: Recipe[] }) {
  const [household, setHousehold] = useState(1);
  const [budget, setBudget] = useState('');
  const cost = useMemo(() => groceryCost({ days }, household), [days, household]);
  const swaps = useMemo(() => cheaperSwaps({ days }, pool, recipes), [days, pool, recipes]);
  const weekly = cost.pricedCost * (7 / cost.days);
  const budgetN = parseFloat(budget);
  const hasBudget = Number.isFinite(budgetN) && budgetN > 0;
  const bls = cost.sources.find((s) => s.source === 'BLS');
  const ers = cost.sources.find((s) => s.source === 'ERS');
  const periods = bls ? bls.periods.map(monthName).join(', ') : '';
  const ersWeekly = cost.costBySource.ERS * (7 / cost.days);
  const priced = cost.lines.filter((l) => l.cost !== null).length;

  return (
    <section class="mpg__budget card" aria-labelledby="mpg-budget-h">
      <h2 class="mpg__h" id="mpg-budget-h">Grocery quantities and cost estimate</h2>
      <div class="mpg__budget-inputs">
        <label class="mpg__field">
          <span>People eating this plan</span>
          <input type="number" min="1" max="8" step="1" value={household}
            onInput={(e) => setHousehold(clampHousehold(parseFloat((e.target as HTMLInputElement).value)))} />
        </label>
        <label class="mpg__field">
          <span>Weekly grocery budget (optional, $)</span>
          <input type="number" min="0" step="1" inputMode="decimal" value={budget}
            onInput={(e) => setBudget((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <p class="mpg__budget-total" aria-live="polite">
        {cost.incomplete && <strong>Incomplete estimate. </strong>}
        Estimated cost of the <strong>{priced} of {cost.lines.length}</strong> items with a U.S. average price:{' '}
        <strong>{usd(weekly)} per week</strong> ({usd(cost.perDay)} per day) for {cost.household} {cost.household === 1 ? 'person' : 'people'}.
        {cost.incomplete && ' Items without a price are not included, so your total will be higher.'}
        {ers && ` ${usd(ersWeekly)} of this uses ${ers.periods[0]} USDA produce prices that are not adjusted for inflation, so it is likely low.`}
      </p>
      {hasBudget && (
        <p class={`mpg__budget-flag ${weekly > budgetN ? 'is-over' : 'is-under'}`}>
          {weekly > budgetN
            ? `The priced items alone are ${usd(weekly - budgetN)} over your ${usd(budgetN)} weekly budget.`
            : `The priced items come to ${usd(weekly)} of your ${usd(budgetN)} weekly budget. Unpriced items are extra.`}
        </p>
      )}

      {hasBudget && (
        <div class="mpg__swaps">
          <h3 class="mpg__h3">Cheaper swaps</h3>
          {swaps.length ? (
            <ul>
              {swaps.slice(0, 5).map((s) => (
                <li>Day {s.day + 1}: <strong>{s.to}</strong> instead of {s.from} (about {usd(s.saving * household)} less, similar calories). Use the meal's swap button to choose it.</li>
              ))}
            </ul>
          ) : (
            <p>Not enough price data to compare these recipes fairly, so no swaps are suggested. Recipes are compared only when at least 60% of their ingredients have a price.</p>
          )}
        </div>
      )}

      <table class="mpg__qty">
        <caption class="sr-only">Grocery quantities for the week</caption>
        <thead><tr><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Meals</th><th scope="col">Est. cost</th></tr></thead>
        <tbody>
          {cost.lines.map((l) => (
            <tr>
              <th scope="row">{l.name}</th>
              <td>{formatAmount(l.amount, l.unit)}</td>
              <td>{l.meals}</td>
              <td>{l.cost === null ? 'no price' : l.source === 'ERS' ? `${usd(l.cost)} (${ers?.periods[0]} price)` : usd(l.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p class="mpg__budget-note">
        Amounts are typical per-serving estimates, not weighed recipes. Prices are U.S. city averages ({periods}) from the{' '}
        <a href="https://www.bls.gov/cpi/factsheets/average-prices.htm">U.S. Bureau of Labor Statistics</a>
        {ers && (
          <>
            {' '}and, for produce with no current BLS price, {ers.periods[0]} national averages from the{' '}
            <a href={ers.url}>USDA Economic Research Service</a> (not adjusted for inflation)
          </>
        )}
        . Costs allow for peels, trimming and drained liquid using USDA preparation yields. Prices vary by region and
        store and are not a price guarantee. This plan is not checked for nutritional completeness. If you have a medical
        condition, food allergy or are pregnant, plan with a registered dietitian or clinician.
      </p>
    </section>
  );
}
