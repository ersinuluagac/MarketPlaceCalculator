function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function markedAsReversed(line) {
  const status = String(line.status ?? "").trim().toLocaleLowerCase("tr");
  return status === "iade edildi" || status === "iptal edildi";
}

// undefined = no match on this price basis; null = multiple possible answers
// or an order too complex to resolve safely in a browser.
function matchAmounts(lines, target, field) {
  if (lines.some(line => !Number.isSafeInteger(line[field]) || line[field] < 0)) return undefined;
  const qty = lines.map(() => 0);
  const amounts = lines.map(() => 0);
  const candidates = [];
  let remaining = target;
  let available = 0;
  let freeLine = false;
  for (const [index, line] of lines.entries()) {
    const amount = line[field];
    if (markedAsReversed(line)) {
      qty[index] = line.qty;
      amounts[index] = amount;
      remaining -= amount;
    } else if (amount === 0) {
      freeLine = true;
    } else {
      // A line can be split only in increments with an exact whole-kuruş price.
      const steps = gcd(amount, line.qty);
      candidates.push({index, steps, unitAmount: amount / steps, unitQty: line.qty / steps});
      available += amount;
    }
  }
  if (!Number.isSafeInteger(available) || remaining < 0 || remaining > available) return undefined;

  if (remaining === available || remaining === 0) {
    if (freeLine) return null;
    if (remaining > 0) {
      for (const {index} of candidates) {
        qty[index] = lines[index].qty;
        amounts[index] = lines[index][field];
      }
    }
    return {qty, amounts};
  }

  // Try high-value units first. Bounds leave at most one choice at the last
  // line, including when a single SKU was ordered in very large quantities.
  candidates.sort((a, b) => b.unitAmount - a.unitAmount);
  if (candidates.length > 64) return null;
  let solution;
  let visits = 0;
  function search(i, needed, capacity) {
    if (++visits > 20000) { solution = null; return; }
    if (i === candidates.length) {
      const ambiguous = solution !== undefined || freeLine;
      solution = ambiguous ? null : {qty: qty.slice(), amounts: amounts.slice()};
      return;
    }
    const {index, unitAmount, unitQty, steps} = candidates[i];
    const rest = capacity - lines[index][field];
    const min = Math.max(0, Math.ceil((needed - rest) / unitAmount));
    const max = Math.min(steps, Math.floor(needed / unitAmount));
    for (let count = min; count <= max && solution !== null; count++) {
      qty[index] = count * unitQty;
      amounts[index] = count * unitAmount;
      search(i + 1, needed - amounts[index], rest);
    }
  }
  search(0, remaining, available);
  return solution;
}

// reversedCents is the positive value reversed for the listed lines. Returned
// amounts are positive kuruş on the matching price basis, in input line order.
export function resolveReturnedUnits(lines, reversedCents) {
  if (!Number.isSafeInteger(reversedCents) || reversedCents < 0 ||
      lines.some(line => !Number.isSafeInteger(line.qty) || line.qty < 1)) return null;
  if (!reversedCents) return {qty: lines.map(() => 0), amounts: lines.map(() => 0)};
  const gross = matchAmounts(lines, reversedCents, "gross");
  if (gross !== undefined) return gross;
  return matchAmounts(lines, reversedCents, "invoice") ?? null;
}
