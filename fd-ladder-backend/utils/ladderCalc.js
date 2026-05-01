// Default rates if no bank data is available
const DEFAULT_RATES = { 1: 6.8, 2: 7.2, 3: 7.4, 5: 7.6, 7: 7.8 };

// Decide tenures based on liquidity preference
function getTenures(liquidity, duration) {
  if (liquidity === "yearly") {
    if (duration === 3) return [1, 2, 3];
    if (duration === 5) return [1, 2, 3, 4, 5];
    return [1, 2, 3, 5, 7];
  }
  if (liquidity === "every2") {
    if (duration === 3) return [1, 3];
    if (duration === 5) return [2, 3, 5];
    return [2, 4, 7];
  }
  // flexible — maximize returns
  if (duration === 3) return [2, 3];
  if (duration === 5) return [3, 4, 5];
  return [5, 7];
}

// 🔥 NEW: Constraint-based scoring function
function getScores(tenures, rates, tax, liquidity) {
  return tenures.map((t) => {
    const rate = rates[t] || DEFAULT_RATES[t] || 7.0;

    // Return factor (compound growth)
    const returnScore = rate * t;

    // Liquidity penalty (longer tenure = less liquidity)
    let liquidityPenalty = 1;
    if (liquidity === "yearly") liquidityPenalty = 1 / t;
    else if (liquidity === "every2") liquidityPenalty = 1 / (t * 0.7);
    else liquidityPenalty = 1; // flexible

    // Tax penalty (higher rate = higher tax)
    const taxPenalty = 1 - tax;

    // Final score
    const score = returnScore * liquidityPenalty * taxPenalty;

    return score;
  });
}

// Normalize scores → allocation %
function normalizeScores(scores) {
  const total = scores.reduce((a, b) => a + b, 0);
  return scores.map((s) => s / total);
}

// MAIN FUNCTION
function calculateLadder({
  amount,
  taxBracket,
  liquidity,
  duration,
  rates = DEFAULT_RATES,
  inflation = 6,
}) {
  const tax = taxBracket / 100;
  const dur = parseInt(duration);

  const tenures = getTenures(liquidity, dur);

  // 🔥 NEW: Optimization engine
  const scores = getScores(tenures, rates, tax, liquidity);
  const allocations = normalizeScores(scores);

  const rungs = tenures.map((t, i) => {
    const rate = rates[t] || DEFAULT_RATES[t] || 7.0;

    const principal = amount * allocations[i];

    const maturity = principal * Math.pow(1 + rate / 100, t);
    const interest = maturity - principal;
    const taxAmt = interest * tax;
    const netReturn = interest - taxAmt;

    // Inflation-adjusted return
    const realReturn =
      Math.pow(1 + rate / 100, t) /
        Math.pow(1 + inflation / 100, t) -
      1;

    const realMaturity = principal * (1 + realReturn);

    // Explanation
    let reason = "Balanced allocation";
    if (t >= 5) reason = "Higher return but lower liquidity";
    if (t <= 2) reason = "High liquidity, lower returns";

    return {
      tenure: t,
      principal,
      rate,
      maturity,
      interest,
      taxAmt,
      netReturn,
      realMaturity,
      score: scores[i], // 🔥 NEW (important)
      reason,
    };
  });

  const totalMaturity = rungs.reduce((a, r) => a + r.maturity, 0);
  const totalNet = rungs.reduce(
    (a, r) => a + r.principal + r.netReturn,
    0
  );
  const totalTax = rungs.reduce((a, r) => a + r.taxAmt, 0);

  // Single FD comparison
  const singleRate = rates[dur] || DEFAULT_RATES[dur] || 7.6;
  const singleMaturity = amount * Math.pow(1 + singleRate / 100, dur);
  const singleInterest = singleMaturity - amount;
  const singleTax = singleInterest * tax;
  const singleFDNet = amount + singleInterest - singleTax;

  return {
    rungs,
    totalMaturity,
    totalNet,
    totalTax,
    singleFDNet,
  };
}

module.exports = { calculateLadder };