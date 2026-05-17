import joblib
import numpy as np
import pandas as pd
import os

BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(BASE_DIR, "models")

RF_MODEL     = joblib.load(os.path.join(MODELS_DIR, "rf_model.pkl"))
KNN_MODEL    = joblib.load(os.path.join(MODELS_DIR, "knn_model.pkl"))
SCALER       = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
ENCODERS     = joblib.load(os.path.join(MODELS_DIR, "encoders.pkl"))
FEATURE_COLS = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))
DATASET      = joblib.load(os.path.join(MODELS_DIR, "dataset.pkl"))

TARGET = "Recommended_Destination"

ORDINAL_COLS = {
    "Budget_Range":                ["Low", "Medium", "High"],
    "Crowd_Tolerance":             ["Low", "Medium", "High"],
    "Safety_Priority":             ["Low", "Medium", "High"],
    "Preferred_Temperature_Range": ["Cold", "Moderate", "Warm", "Hot"],
}
BINARY_COLS = [
    "Willingness_To_Explore_New_Regions",
    "Visa_Free_Travel_Preference",
]

RAW_COLS = [c for c in DATASET.columns if c not in [TARGET, "User_ID"]]

CONTINENT_MAP = {
    'Asia':              ['Bali','Kerala','Maldives','Goa','Thailand','Tokyo',
                          'Dubai','Manali','Leh-Ladakh','Andaman','Rajasthan','Singapore'],
    'Europe':            ['Paris','London','Rome','Switzerland','Santorini','Iceland'],
    'Africa':            ['Cape Town'],
    'North America':     ['Canada'],
    'South America':     ['Machu Picchu'],
    'Australia/Oceania': ['New Zealand'],
}


def _preprocess(user_input: dict) -> pd.DataFrame:
    default = {col: DATASET[col].mode()[0] for col in RAW_COLS}
    default.update(user_input)

    input_df = pd.DataFrame([default])

    for col, order in ORDINAL_COLS.items():
        try:
            input_df[col] = ENCODERS[col].transform(input_df[col].astype(str))
        except ValueError:
            input_df[col] = 0

    for col in BINARY_COLS:
        input_df[col] = (input_df[col].str.lower() == "yes").astype(int)

    nominal_cols = input_df.select_dtypes(include="object").columns.tolist()
    input_df = pd.get_dummies(input_df, columns=nominal_cols)
    input_df = input_df.reindex(columns=FEATURE_COLS, fill_value=0)

    return input_df


def recommend(user_input: dict, n: int = 5):
    input_df = _preprocess(user_input)

    # RF — get probabilities for all classes
    probs   = RF_MODEL.predict_proba(input_df)[0]
    classes = RF_MODEL.classes_

    # Build a dict: destination → probability
    prob_dict = dict(zip(classes, probs))

    # Get top candidates
    top_indices = np.argsort(probs)[::-1][:n * 3]
    rf_ranked   = list(classes[top_indices])

    # Continent filter
    if "Preferred_Continent" in user_input:
        allowed  = CONTINENT_MAP.get(user_input["Preferred_Continent"], [])
        filtered = [d for d in rf_ranked if d in allowed]
        if len(filtered) >= 3:
            rf_ranked = filtered

    # KNN
    input_scaled = SCALER.transform(input_df)
    _, indices   = KNN_MODEL.kneighbors(input_scaled, n_neighbors=n * 2)
    knn_results  = DATASET.iloc[indices[0]][TARGET].tolist()

    # Filter KNN by continent too
    if "Preferred_Continent" in user_input:
        allowed     = CONTINENT_MAP.get(user_input["Preferred_Continent"], [])
        knn_filtered = [d for d in knn_results if d in allowed]
        if len(knn_filtered) >= 2:
            knn_results = knn_filtered

    # Merge preserving RF rank order
    seen  = set()
    final = []
    for dest in rf_ranked + knn_results:
        if dest not in seen:
            seen.add(dest)
            final.append(dest)
        if len(final) == n:
            break

    # Return destinations + their probabilities (scaled so top = ~0.95)
    dest_probs = [prob_dict.get(d, 0.0) for d in final]
    max_p = max(dest_probs) if dest_probs else 1
    if max_p > 0:
        # Normalise so top result shows ~90-95% match
        dest_probs = [min(0.95, (p / max_p) * 0.95) for p in dest_probs]

    return final, dest_probs