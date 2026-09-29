from typing import Any, Dict
import pandas as pd
from scipy import stats


def run_correlation_hypothesis_test(
    x: pd.Series, y: pd.Series, alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Run a Pearson correlation hypothesis test between two aligned numeric series.

    Statistical Hypotheses:
        H0: No linear relationship exists (correlation r = 0).
        H1: A linear relationship exists (correlation r != 0).

    Args:
        x: First numeric pandas Series.
        y: Second numeric pandas Series.
        alpha: Significance level threshold (default 0.05).

    Returns:
        dict: {
            "r": float,
            "p_value": float,
            "alpha": float,
            "n_obs": int,
            "reject_null": bool,
            "interpretation": str,
        }

    Raises:
        ValueError: If fewer than 3 overlapping aligned observations are available.
    """
    if x is None or y is None or x.empty or y.empty:
        raise ValueError("Cannot perform correlation test on empty series.")

    # Inner join on common index
    aligned = pd.concat([x.rename("x"), y.rename("y")], axis=1, join="inner").dropna()

    # If direct join has < 3 points, attempt calendar month alignment for date-like indices
    if len(aligned) < 3:
        try:
            x_period = x.copy()
            y_period = y.copy()
            x_period.index = pd.to_datetime(x.index).to_period("M")
            y_period.index = pd.to_datetime(y.index).to_period("M")
            period_aligned = pd.concat(
                [x_period.rename("x"), y_period.rename("y")],
                axis=1,
                join="inner",
            ).dropna()
            if len(period_aligned) >= 3:
                aligned = period_aligned
        except Exception:
            pass

    n_obs = len(aligned)
    if n_obs < 3:
        raise ValueError(
            f"Insufficient overlapping observations for correlation hypothesis test: "
            f"found {n_obs} aligned points, minimum required is 3."
        )

    res = stats.pearsonr(aligned["x"], aligned["y"])
    r_val = float(res.statistic) if hasattr(res, "statistic") else float(res[0])
    p_val = float(res.pvalue) if hasattr(res, "pvalue") else float(res[1])

    reject_null = bool(p_val < alpha)

    if reject_null:
        interpretation = (
            f"Reject H0: a statistically significant relationship was found "
            f"(r={r_val:.4f}, p={p_val:.4f} < alpha={alpha:.2f})."
        )
    else:
        interpretation = (
            f"Fail to reject H0: no statistically significant relationship was found "
            f"(r={r_val:.4f}, p={p_val:.4f} >= alpha={alpha:.2f})."
        )

    return {
        "r": r_val,
        "p_value": p_val,
        "alpha": float(alpha),
        "n_obs": int(n_obs),
        "reject_null": reject_null,
        "interpretation": interpretation,
    }
