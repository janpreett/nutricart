import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
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

# Assign clusters to recipes
data['cluster'] = model.predict(scaled_features)

# Save the scaler, model, and updated recipes
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(model, 'meal_cluster_model.pkl')
data.to_csv('recipes_with_clusters.csv', index=False)

print("Files generated successfully.")