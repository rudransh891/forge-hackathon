"""Send the complaint by SMTP to the team test inbox. Never raises; returns an honest record."""
import mimetypes
import os
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()


def find_photo(photo_path):
    if not photo_path:
        return None
    for p in (photo_path, os.path.join("uploads", photo_path),
              os.path.join("uploads", os.path.basename(photo_path))):
        if os.path.isfile(p):
            return p
    return None


def send_email(subject, body, attachment_path=None):
    record = {
        "channel": "email",
        "target": "FixIt Bharat team test inbox (not a government department)",
        "attempted_at": datetime.now(timezone.utc).isoformat(),
        "ok": False,
        "photo_attached": False,
        "error": None,
    }
    try:
        to = os.getenv("ROUTING_TEST_RECIPIENT", "").strip()
        host = os.getenv("SMTP_HOST", "").strip()
        port = int(os.getenv("SMTP_PORT", "587").strip())
        user = os.getenv("SMTP_USER", "").strip()
        pw = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()
        if not (to and host and user and pw):
            record["error"] = "email settings incomplete"
            return record

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = user
        msg["To"] = to
        msg.set_content(body)
        if attachment_path:
            ctype = mimetypes.guess_type(attachment_path)[0] or "application/octet-stream"
            main, sub = ctype.split("/", 1)
            with open(attachment_path, "rb") as f:
                msg.add_attachment(f.read(), maintype=main, subtype=sub,
                                   filename=os.path.basename(attachment_path))
            record["photo_attached"] = True

        with smtplib.SMTP(host, port, timeout=20) as s:
            s.starttls(context=ssl.create_default_context())
            s.login(user, pw)
            s.send_message(msg)
        record["ok"] = True
        record["delivered_at"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        record["error"] = type(e).__name__
    return record
