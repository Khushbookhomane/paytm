import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import SessionLocal
from app.services.copilot import process_copilot_chat

def main():
    db = SessionLocal()
    questions = [
        ("आज की बिक्री कितनी हुई?", "hi"),
        ("What should I restock?", "en"),
        ("Which customers should I message?", "en"),
        ("इस हफ्ते मेरा profit कितना हुआ?", "hi"),
        ("आजची विक्री किती झाली?", "mr"),
    ]

    print("=" * 60)
    print("VERIFYING COPILOT VERNACULAR & TOOL INTENTS")
    print("=" * 60)
    for q, lang in questions:
        res = process_copilot_chat(q, lang, 1, db)
        print(f"Query:  {q}")
        print(f"Lang:   {res['language']}")
        print(f"Tools:  {res['tools_used']}")
        print(f"Reply:  {res['reply']}")
        print("-" * 60)
    db.close()

if __name__ == "__main__":
    main()
