"""Hindi text for the poll: the question and its options live in the database, so
they cannot be translated in the bundle.

Run from Backend/ as a module:
    .venv\\Scripts\\python.exe -m db.migrate_008_poll_hindi
"""
from sqlalchemy import text

from api.database import engine

SQL = """
alter table polls add column if not exists question_hi text;
alter table poll_options add column if not exists label_hi text;
"""

QUESTION_HI = "इस हफ़्ते पायलट पहले किस काम को प्राथमिकता दे?"

OPTIONS_HI = {
    "Potholes and road damage": "गड्ढे और सड़क क्षति",
    "Garbage collection": "कचरा संग्रह",
    "Streetlights not working": "स्ट्रीटलाइट काम नहीं कर रही",
}

if __name__ == "__main__":
    with engine.begin() as conn:
        conn.exec_driver_sql(SQL)

        conn.execute(
            text("update polls set question_hi = :q where question_hi is null"),
            {"q": QUESTION_HI},
        )
        for english, hindi in OPTIONS_HI.items():
            conn.execute(
                text(
                    "update poll_options set label_hi = :h "
                    "where label = :e and label_hi is null"
                ),
                {"h": hindi, "e": english},
            )

        rows = conn.execute(
            text("select label, label_hi from poll_options order by ordinal, label")
        ).all()

    for label, label_hi in rows:
        print(f"  {label} -> {label_hi}")
