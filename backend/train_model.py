import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib

# Load the dataset
data = pd.read_csv('recipes.csv')

# Select relevant features
features = data[['calories', 'protein', 'carbs', 'fat']].fillna(0)

# Preprocess: Scale features
scaler = StandardScaler()
scaled_features = scaler.fit_transform(features)

# Train KMeans model
model = KMeans(n_clusters=10, random_state=42, n_init=10)
model.fit(scaled_features)

# Predict clusters for the recipes
data['cluster'] = model.predict(scaled_features)

# Save the scaler and model
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(model, 'meal_cluster_model.pkl')

# Save the recipes with cluster labels
data.to_csv('recipes_with_clusters.csv', index=False)

print("Model trained, scaler saved, and recipes with clusters saved to 'recipes_with_clusters.csv'")