import os, smtplib, ssl
from email.message import EmailMessage
from dotenv import load_dotenv
load_dotenv()

names = ["ROUTING_TEST_RECIPIENT", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]
missing = [n for n in names if not os.getenv(n, "").strip()]
print("missing settings:", missing or "none")
if missing:
    raise SystemExit(1)

host = os.getenv("SMTP_HOST").strip()
port = int(os.getenv("SMTP_PORT").strip())
user = os.getenv("SMTP_USER").strip()
pw = os.getenv("SMTP_PASSWORD").replace(" ", "").strip()
to = os.getenv("ROUTING_TEST_RECIPIENT").strip()

msg = EmailMessage()
msg["Subject"] = "FixIt Bharat: email delivery test"
msg["From"] = user
msg["To"] = to
msg.set_content("This is a connectivity test from the FixIt Bharat project. "
                "It is not a real complaint and was not sent to any department.")

try:
    with smtplib.SMTP(host, port, timeout=20) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(user, pw)
        s.send_message(msg)
    print("SENT: check the inbox of the test recipient (also Spam)")
except smtplib.SMTPAuthenticationError as e:
    print("LOGIN FAILED, SMTP code", e.smtp_code)
except Exception as e:
    print("FAILED:", type(e).__name__)
