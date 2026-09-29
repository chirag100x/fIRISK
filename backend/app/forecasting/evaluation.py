from typing import Any, Dict
import numpy as np
import pandas as pd


def evaluate_forecast(results_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Evaluate forecast predictions against actual realized values.

    Generic evaluation function applicable to any forecaster outputs.
    Expects columns: ['date', 'prev_actual', 'actual', 'predicted'].

    Metrics:
        mae: Mean Absolute Error (in asset price currency/units).
        rmse: Root Mean Squared Error (in asset price currency/units).
        mape: Mean Absolute Percentage Error (percentage, e.g. 2.8 for 2.8%).
        directional_accuracy: Percentage of time predicted direction matches actual direction.
        n_obs: Total evaluated observations.

    Args:
        results_df: pd.DataFrame with ['date', 'prev_actual', 'actual', 'predicted'].

    Returns:
        dict: {
            "mae": float,
            "rmse": float,
            "mape": float,
            "directional_accuracy": float,
            "n_obs": int,
        }

    Raises:
        ValueError: If results_df is empty or missing required columns.
    """
    if results_df is None or results_df.empty:
        raise ValueError("Cannot evaluate empty results DataFrame.")

    required_cols = ["date", "prev_actual", "actual", "predicted"]
    for col in required_cols:
        if col not in results_df.columns:
            raise ValueError(f"Results DataFrame missing required column: '{col}'.")

    clean_df = results_df.dropna(subset=["actual", "predicted", "prev_actual"]).copy()
    if clean_df.empty:
        raise ValueError("No valid rows remaining after dropping NaNs in evaluation data.")

    actual = clean_df["actual"].astype(float)
    predicted = clean_df["predicted"].astype(float)
    prev_actual = clean_df["prev_actual"].astype(float)

    error = actual - predicted
    mae = float(np.mean(np.abs(error)))
    rmse = float(np.sqrt(np.mean(error**2)))

    # MAPE as a percentage (e.g. 3.2 for 3.2%)
    non_zero_actuals = actual.replace(0, np.nan)
    mape = float(np.nanmean(np.abs(error / non_zero_actuals)) * 100.0)

    # Directional accuracy: sign of (actual - prev_actual) vs sign of (predicted - prev_actual)
    actual_direction = np.sign(actual - prev_actual)
    predicted_direction = np.sign(predicted - prev_actual)
    directional_match = actual_direction == predicted_direction
    directional_accuracy = float(np.mean(directional_match) * 100.0)

    n_obs = len(clean_df)

    return {
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "directional_accuracy": directional_accuracy,
        "n_obs": n_obs,
    }
