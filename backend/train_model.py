import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# --- Configuration ---
INPUT_CSV       = 'recipes.csv'
OUTPUT_CSV      = 'recipes_with_clusters.csv'
SCALER_PATH     = 'scaler.pkl'
MODEL_PATH      = 'meal_cluster_model.pkl'
N_CLUSTERS      = 10
RANDOM_STATE    = 42

def main():
    # 1) Load the full recipes dataset (must include a 'price' column)
    df = pd.read_csv(INPUT_CSV)

    # 2) Select features for clustering: nutrition + price
    features = df[['calories', 'protein', 'carbs', 'fat', 'price']].fillna(0)

    # 3) Scale features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)

    # 4) Train KMeans model
    model = KMeans(n_clusters=N_CLUSTERS, random_state=RANDOM_STATE, n_init=10)
    model.fit(scaled_features)

    # 5) Assign cluster labels back to DataFrame
    df['cluster'] = model.predict(scaled_features)

    # 6) Save artifacts and updated CSV
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(model, MODEL_PATH)
    df.to_csv(OUTPUT_CSV, index=False)

    print("✅ Generated files:")
    print(f"   • {SCALER_PATH}")
    print(f"   • {MODEL_PATH}")
    print(f"   • {OUTPUT_CSV}")

if __name__ == '__main__':
    main()
