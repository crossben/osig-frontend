// Reads what the browser can't see: links OSIG "emailed" (the mail_outbox
// table, used when SMTP isn't configured) and TOTP codes, via the backend venv.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const BACKEND = path.resolve(__dirname, '../../backend');
const PY = path.join(BACKEND, '.venv/bin/python');

function py(code: string, ...args: string[]): string {
  // SQLAlchemy echo logs share stdout: the answer is the last line
  const out = execFileSync(PY, ['-c', code, ...args], { cwd: BACKEND, encoding: 'utf8' }).trim().split('\n');
  return out[out.length - 1];
}

/** Hash route (e.g. "/verify-email?token=...") from the newest mail of this kind */
export function mailedLink(email: string, kind: 'verify_email' | 'reset_password'): string {
  return py(`
import re, sys
import app.models
from app.db.session import SessionLocal
from app.models.platform import MailOutbox
db = SessionLocal()
m = db.query(MailOutbox).filter(MailOutbox.to == sys.argv[1], MailOutbox.kind == sys.argv[2]).order_by(MailOutbox.created_at.desc()).first()
print(re.search(r"#(/[^\\s]+)", m.body).group(1))
`, email, kind);
}

export function totp(secret: string): string {
  return py('import pyotp, sys; print(pyotp.TOTP(sys.argv[1]).now())', secret);
}

export function markVerified(email: string) {
  py(`
import sys
import app.models
from app.db.session import SessionLocal
from app.models.user import User
db = SessionLocal(); db.query(User).filter(User.email == sys.argv[1]).update({"email_verified": True}); db.commit()
`, email);
}
