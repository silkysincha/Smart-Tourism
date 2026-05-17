import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

TARGET_ROWS = 3000
OUTPUT_FILE = "Dataset_v2.xlsx"
INPUT_FILE = "Dataset.xlsx"

# ── Value pools ─────────────────────────────────────────────

SEASONS = ['Spring', 'Summer', 'Monsoon', 'Winter']
SEASON_W = [0.29, 0.22, 0.22, 0.27]

CONTINENTS = ['Asia','Europe','Africa','North America','South America','Australia/Oceania']
CONTINENT_W = [0.20, 0.16, 0.16, 0.15, 0.15, 0.18]

COUNTRY_TYPES = ['Domestic', 'International']
COUNTRY_W = [0.45, 0.55]

BUDGET_RANGES = ['Low','Medium','High']
BUDGET_W = [0.35, 0.35, 0.30]

TEMP_RANGES = ['Cold','Moderate','Warm','Hot']
TEMP_W = [0.30, 0.40, 0.25, 0.05]

TRAVEL_PURPOSES = ['Adventure','Cultural Exploration','Educational','Honeymoon','Relaxation']
TRAVEL_TYPES = ['Solo','Couple','Family','Friends/Group']

# ── Destination logic ──────────────────────────────────────

DESTINATION_PROFILES = {
    'Bali': {'Activity_Beaches':1, 'Budget_Range':['Medium','High'], 'Travel_Purpose':['Relaxation','Honeymoon']},
    'Maldives': {'Activity_Beaches':1, 'Budget_Range':['High'], 'Travel_Purpose':['Honeymoon']},
    'Manali': {'Activity_Mountains':1, 'Preferred_Temperature_Range':['Cold'], 'Travel_Purpose':['Adventure']},
    'Goa': {'Activity_Beaches':1, 'Budget_Range':['Low','Medium'], 'Travel_Type':['Friends/Group']},
    'Paris': {'Activity_Historical_Places':1, 'Travel_Purpose':['Cultural Exploration']},
    'Dubai': {'Activity_Shopping':1, 'Budget_Range':['High']},
    'Kerala': {'Activity_Wildlife_Nature':1, 'Budget_Range':['Low','Medium']},
}

# ── Scoring function ───────────────────────────────────────

def score_destination(profile, row):
    score = 1.0

    for key, val in profile.items():
        if key not in row:
            continue

        row_val = row[key]

        if isinstance(val, list):
            if row_val in val:
                score *= 1.5
        elif isinstance(val, int):
            if row_val == val:
                score *= 1.3
        elif isinstance(val, str):
            if row_val == val:
                score *= 1.3

    return score


def pick_destination(row):
    
    # Continent → destinations that belong to it
    CONTINENT_MAP = {
        'Asia':              ['Bali','Kerala','Maldives','Goa','Thailand','Tokyo','Dubai','Manali','Leh-Ladakh','Andaman','Rajasthan','Singapore'],
        'Europe':            ['Paris','London','Rome','Switzerland','Santorini','Iceland'],
        'Africa':            ['Cape Town'],
        'North America':     ['Canada'],
        'South America':     ['Machu Picchu'],
        'Australia/Oceania': ['New Zealand'],
    }

    preferred_continent = row.get('Preferred_Continent', None)
    
    scores = {}
    for dest, profile in DESTINATION_PROFILES.items():
        s = score_destination(profile, row)
        s *= random.uniform(0.9, 1.1)  # small noise only

        # ── Continent hard filter ──────────────────────
        if preferred_continent:
            allowed = CONTINENT_MAP.get(preferred_continent, [])
            if dest not in allowed:
                s *= 0.05  # heavily penalize wrong continent
        
        scores[dest] = s

    total = sum(scores.values())
    probs = [scores[d]/total for d in scores]
    return random.choices(list(scores.keys()), weights=probs)[0]

# ── Row generator ──────────────────────────────────────────

def generate_row(user_id):
    row = {}

    row['User_ID'] = f'USR{user_id}'
    row['Preferred_Season'] = random.choices(SEASONS, SEASON_W)[0]
    row['Preferred_Continent'] = random.choices(CONTINENTS, CONTINENT_W)[0]
    row['Preferred_Country_Type'] = random.choices(COUNTRY_TYPES, COUNTRY_W)[0]

    row['Budget_Range'] = random.choices(BUDGET_RANGES, BUDGET_W)[0]
    row['Preferred_Temperature_Range'] = random.choices(TEMP_RANGES, TEMP_W)[0]

    row['Travel_Purpose'] = random.choice(TRAVEL_PURPOSES)
    row['Travel_Type'] = random.choice(TRAVEL_TYPES)

    # Activities
    row['Activity_Beaches'] = random.choice([0,1])
    row['Activity_Mountains'] = random.choice([0,1])
    row['Activity_Wildlife_Nature'] = random.choice([0,1])
    row['Activity_Historical_Places'] = random.choice([0,1])
    row['Activity_Shopping'] = random.choice([0,1])

    # 🔥 Add human-like noise
    if random.random() < 0.1:
        row['Budget_Range'] = random.choice(BUDGET_RANGES)

    if random.random() < 0.1:
        row['Activity_Beaches'] = 1 - row['Activity_Beaches']

    # Destination
    row['Recommended_Destination'] = pick_destination(row)

    return row


# ── Generate dataset ───────────────────────────────────────

print("Generating new data...")

rows = [generate_row(2000+i) for i in range(TARGET_ROWS)]
new_df = pd.DataFrame(rows)

# Load original dataset
orig_df = pd.read_excel(INPUT_FILE)
orig_df.columns = orig_df.columns.str.strip()

# Combine
final_df = pd.concat([orig_df, new_df], ignore_index=True)

# Save
final_df.to_excel(OUTPUT_FILE, index=False)

print(f"✅ Done! Saved as {OUTPUT_FILE}")
print(f"Total rows: {len(final_df)}")