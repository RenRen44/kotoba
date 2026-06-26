# train_model.py
# Run this once to generate synthetic data and train the XGBoost model
# Output: readiness_model.json (saved in same folder)

import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import json
import os

print("Generating synthetic training data...")

np.random.seed(42)
N = 5000  # simulate 5000 user sessions

data = []
labels = []

for _ in range(N):
    # Simulate a user at some skill level
    true_skill = np.random.uniform(0, 1)

    accuracy_last_10    = np.clip(true_skill + np.random.normal(0, 0.15), 0, 1)
    avg_pknown          = np.clip(true_skill + np.random.normal(0, 0.1),  0, 1)
    avg_ease            = np.clip(1.3 + true_skill * 1.2 + np.random.normal(0, 0.2), 1.3, 2.5)
    mastered_count      = int(true_skill * 50 + np.random.normal(0, 5))
    due_count           = max(0, int((1 - true_skill) * 10 + np.random.normal(0, 2)))
    streak              = int(true_skill * 8 + np.random.normal(0, 1))
    current_level       = np.random.randint(1, 6)  # 1=N5, 2=N4, 3=N3, 4=N2, 5=N1

    features = [
        accuracy_last_10,
        avg_pknown,
        avg_ease,
        max(0, mastered_count),
        max(0, due_count),
        max(0, streak),
        current_level,
    ]

    # Ready to level up if skill is high enough relative to current level
    threshold = 0.3 + current_level * 0.1
    ready = int(true_skill > threshold and accuracy_last_10 > 0.75 and avg_pknown > 0.6)

    data.append(features)
    labels.append(ready)

X = np.array(data)
y = np.array(labels)

print(f"Data: {N} samples, {sum(y)} ready, {N - sum(y)} not ready")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost model...")
model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42,
)
model.fit(X_train, y_train)

preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"Model accuracy: {acc:.2%}")

# Save model
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'readiness_model.json')
model.save_model(model_path)
print(f"Model saved to {model_path}")