import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
import pickle
import os


# -------------------------------
# Download SMS Spam Collection Dataset
# -------------------------------
print("Downloading SMS Spam Collection dataset...")

url = "https://raw.githubusercontent.com/justmarkham/talkingdata-mobile-user-demographics/master/data/sms_spam_collection.txt"

try:
    df = pd.read_csv(url, sep="\t", header=None, names=["label", "message"])
except Exception:
    print("Using sample data instead...")
    df = pd.DataFrame({
        "label": ["ham", "spam", "ham", "ham", "spam"] * 100,
        "message": [
            "Hey, how are you?",
            "WINNER! Claim your prize NOW!!!",
            "Meeting at 3pm today",
            "Call me when you arrive",
            "Click here for FREE money"
        ] * 100
    })

print(f"Dataset loaded: {len(df)} messages")
print(f"\nLabel distribution:\n{df['label'].value_counts()}")

# -------------------------------
# Prepare data
# -------------------------------
X = df["message"]
y = df["label"].map({"ham": 0, "spam": 1})

# -------------------------------
# Split data
# -------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"\nTraining set: {len(X_train)} messages")
print(f"Testing set: {len(X_test)} messages")

# -------------------------------
# Create pipeline
# -------------------------------
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=1000,
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2)
    )),
    ("clf", MultinomialNB())
])

# -------------------------------
# Train model
# -------------------------------
print("\nTraining Naive Bayes classifier...")
pipeline.fit(X_train, y_train)

# -------------------------------
# Evaluate model
# -------------------------------
y_pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\nModel Performance:")
print(f"Accuracy: {accuracy * 100:.2f}%")
print(f"Precision: {precision * 100:.2f}%")
print(f"Recall: {recall * 100:.2f}%")
print(f"F1-Score: {f1 * 100:.2f}%")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# -------------------------------
# Save model
# -------------------------------
os.makedirs("models", exist_ok=True)

with open("models/spam_detector.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("\nModel saved to models/spam_detector.pkl")

# -------------------------------
# Test Predictions
# -------------------------------
print("\n" + "=" * 60)
print("Test Predictions")
print("=" * 60)

test_messages = [
    "Hey, how are you doing today?",
    "CLICK HERE NOW!!! WIN FREE IPHONE!!!",
    "Meeting scheduled for tomorrow at 2pm",
    "Congratulations! You've won $1,000,000!"
]

for msg in test_messages:
    pred = pipeline.predict([msg])[0]
    prob = pipeline.predict_proba([msg])[0][1]  # probability of spam

    label = "SPAM" if pred == 1 else "HAM"
    print(f"\nMessage: {msg}")
    print(f"Prediction: {label}")
    print(f"Spam Probability: {prob * 100:.2f}%")
