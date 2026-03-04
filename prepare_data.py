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
