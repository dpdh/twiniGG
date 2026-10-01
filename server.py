import html
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import sqlite3
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8000"))
ADMIN_DB_PATH = Path(os.environ.get("TWINI_ADMIN_DB", ROOT / "data" / "admin-users.sqlite3"))
ADMIN_SESSION_TTL = 8 * 60 * 60
ADMIN_PASSWORD_ITERATIONS = 310_000
FIRST_ADMIN_EMAIL = "dani.hd@idtc.org"
CITY_INFO = {
    "Medan": {"lat": 3.5952, "lng": 98.6722, "population": 2435252, "populationScope": "Kota Medan", "wage": 4014072, "wageLabel": "UMK Medan", "wageYear": 2025},
    "Jakarta": {"lat": -6.2088, "lng": 106.8456, "population": 10562088, "populationScope": "Provinsi DKI Jakarta", "wage": 5396761, "wageLabel": "UMP DKI Jakarta", "wageYear": 2025},
    "Bandung": {"lat": -6.9175, "lng": 107.6191, "population": 2444160, "populationScope": "Kota Bandung", "wage": 4209309, "wageLabel": "UMK Bandung", "wageYear": 2025},
    "Surabaya": {"lat": -7.2575, "lng": 112.7521, "population": 2874314, "populationScope": "Kota Surabaya", "wage": 4961753, "wageLabel": "UMK Surabaya", "wageYear": 2025},
    "Palembang": {"lat": -2.9761, "lng": 104.7754, "population": 1668848, "populationScope": "Kota Palembang", "wage": 3916635, "wageLabel": "UMK Palembang", "wageYear": 2025},
    "Balikpapan": {"lat": -1.2379, "lng": 116.8529, "population": 688318, "populationScope": "Kota Balikpapan", "wage": 3701508, "wageLabel": "UMK Balikpapan", "wageYear": 2025},
    "Yogyakarta": {"lat": -7.7956, "lng": 110.3695, "population": 373589, "populationScope": "Kota Yogyakarta", "wage": 2655041, "wageLabel": "UMK Kota Yogyakarta", "wageYear": 2025},
    "Makassar": {"lat": -5.1477, "lng": 119.4327, "population": 1423877, "populationScope": "Kota Makassar", "wage": 3880136, "wageLabel": "UMK Makassar", "wageYear": 2025},
    "Denpasar": {"lat": -8.6705, "lng": 115.2126, "population": 725314, "populationScope": "Kota Denpasar", "wage": 3298116, "wageLabel": "UMK Denpasar", "wageYear": 2025},
    "Nusantara": {"lat": -0.9738, "lng": 116.7168, "population": None, "populationScope": "Data sensus kota belum tersedia", "wage": 3579313, "wageLabel": "UMP Kalimantan Timur", "wageYear": 2025}
}


def connect_admin_db():
    ADMIN_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(ADMIN_DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
            password_salt BLOB NOT NULL,
            password_hash BLOB NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS admin_sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
            expires_at INTEGER NOT NULL
        );
    """)
    return connection


@contextmanager
def get_admin_db():
    connection = connect_admin_db()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def hash_admin_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ADMIN_PASSWORD_ITERATIONS)
    return salt, digest
CITY_ALIASES = {
    "Medan": ("medan", "sumatera utara", "sumut"),
    "Jakarta": ("jakarta", "dki", "jaksel", "jakut", "jakbar", "jakpus", "jaktim", "kepulauan seribu"),
    "Bandung": ("bandung", "jawa barat", "jabar"),
    "Surabaya": ("surabaya", "jawa timur", "jatim"),
    "Palembang": ("palembang", "sumatera selatan", "sumsel"),
    "Balikpapan": ("balikpapan", "kalimantan timur", "kaltim"),
    "Yogyakarta": ("yogyakarta", "jogja", "diy"),
    "Makassar": ("makassar", "sulawesi selatan", "sulsel"),
    "Denpasar": ("denpasar", "bali"),
    "Nusantara": ("nusantara", "ikn", "kalimantan timur", "kaltim")
}


class TwiniHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/api/admin/status":
            self.handle_admin_status()
            return
        if path == "/api/admin/users":
            self.handle_admin_users()
            return
        if path == "/api/city-news":
            self.handle_city_info()
            return
        super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path not in {"/api/admin/setup", "/api/admin/login", "/api/admin/logout", "/api/admin/users"}:
            if path.startswith("/api/admin/"):
                self.send_json(404, {"error": "Endpoint admin tidak ditemukan."})
                return
            self.send_json(404, {"error": "Endpoint tidak ditemukan."})
            return
        if not self.request_is_same_origin():
            self.send_json(403, {"error": "Permintaan lintas situs ditolak."})
            return

        try:
            payload = self.read_json_payload()
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "Format permintaan tidak valid."})
            return

        if path == "/api/admin/setup":
            self.handle_admin_setup(payload)
        elif path == "/api/admin/login":
            self.handle_admin_login(payload)
        elif path == "/api/admin/logout":
            self.handle_admin_logout()
        else:
            self.handle_admin_create_user(payload)

    def do_PATCH(self):
        match = re.fullmatch(r"/api/admin/users/(\d+)", urlsplit(self.path).path)
        if not match:
            self.send_json(404, {"error": "Endpoint admin tidak ditemukan."})
            return
        if not self.request_is_same_origin():
            self.send_json(403, {"error": "Permintaan lintas situs ditolak."})
            return
        try:
            payload = self.read_json_payload()
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "Format permintaan tidak valid."})
            return
        self.handle_admin_update_user(int(match.group(1)), payload)

    def read_json_payload(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > 16_384:
            raise ValueError("Permintaan terlalu besar.")
        payload = json.loads(self.rfile.read(content_length) or b"{}")
        if not isinstance(payload, dict):
            raise ValueError("Objek JSON diperlukan.")
        return payload

    def request_is_same_origin(self):
        origin = self.headers.get("Origin")
        return bool(origin and urlsplit(origin).netloc.lower() == self.headers.get("Host", "").lower())

    def client_is_loopback(self):
        try:
            return ipaddress.ip_address(self.client_address[0]).is_loopback
        except ValueError:
            return False

    def current_admin_user(self):
        match = re.search(r"(?:^|;\s*)twini_admin_session=([^;]+)", self.headers.get("Cookie", ""))
        if not match:
            return None
        token_hash = hashlib.sha256(match.group(1).encode("ascii", errors="ignore")).hexdigest()
        now = int(datetime.now(timezone.utc).timestamp())
        with get_admin_db() as connection:
            row = connection.execute("""
                SELECT u.id, u.email, u.role, u.active
                FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
                WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1
            """, (token_hash, now)).fetchone()
            connection.execute("DELETE FROM admin_sessions WHERE expires_at <= ?", (now,))
        return dict(row) if row else None

    def start_admin_session(self, user_id):
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
        expires_at = int(datetime.now(timezone.utc).timestamp()) + ADMIN_SESSION_TTL
        with get_admin_db() as connection:
            connection.execute(
                "INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (token_hash, user_id, expires_at)
            )
        secure = "; Secure" if os.environ.get("TWINI_COOKIE_SECURE") == "1" else ""
        self.send_header("Set-Cookie", f"twini_admin_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={ADMIN_SESSION_TTL}{secure}")

    def require_super_admin(self):
        user = self.current_admin_user()
        if not user or user["role"] != "super_admin":
            self.send_json(403, {"error": "Akses super admin diperlukan."})
            return None
        return user

    def handle_admin_status(self):
        with get_admin_db() as connection:
            user_count = connection.execute("SELECT COUNT(*) FROM admin_users").fetchone()[0]
        self.send_json(200, {
            "setupRequired": user_count == 0,
            "currentUser": self.current_admin_user()
        })

    def handle_admin_setup(self, payload):
        if not self.client_is_loopback():
            self.send_json(403, {"error": "Penyiapan admin pertama hanya tersedia dari perangkat server."})
            return
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        if email != FIRST_ADMIN_EMAIL or len(password) < 10 or len(password) > 256:
            self.send_json(400, {"error": "Gunakan email admin awal dan password minimal 10 karakter."})
            return

        salt, password_hash = hash_admin_password(password)
        connection = connect_admin_db()
        try:
            connection.execute("BEGIN IMMEDIATE")
            if connection.execute("SELECT COUNT(*) FROM admin_users").fetchone()[0]:
                connection.rollback()
                self.send_json(409, {"error": "Penyiapan admin sudah selesai."})
                return
            cursor = connection.execute("""
                INSERT INTO admin_users (email, role, password_salt, password_hash)
                VALUES (?, 'super_admin', ?, ?)
            """, (email, salt, password_hash))
            user_id = cursor.lastrowid
            connection.commit()
        except sqlite3.IntegrityError:
            connection.rollback()
            self.send_json(409, {"error": "Email sudah terdaftar."})
            return
        finally:
            connection.close()

        self.send_response(201)
        self.start_admin_session(user_id)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(json.dumps({"user": {"id": user_id, "email": email, "role": "super_admin"}}).encode("utf-8"))

    def handle_admin_login(self, payload):
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        with get_admin_db() as connection:
            user = connection.execute("SELECT * FROM admin_users WHERE email = ?", (email,)).fetchone()
        salt = user["password_salt"] if user else bytes(16)
        expected_hash = user["password_hash"] if user else bytes(32)
        _, actual_hash = hash_admin_password(password, salt)
        if not user or not user["active"] or not hmac.compare_digest(actual_hash, expected_hash):
            self.send_json(401, {"error": "Email atau password tidak sesuai."})
            return
        self.send_response(200)
        self.start_admin_session(user["id"])
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(json.dumps({"user": {"id": user["id"], "email": user["email"], "role": user["role"]}}).encode("utf-8"))

    def handle_admin_logout(self):
        match = re.search(r"(?:^|;\s*)twini_admin_session=([^;]+)", self.headers.get("Cookie", ""))
        if match:
            token_hash = hashlib.sha256(match.group(1).encode("ascii", errors="ignore")).hexdigest()
            with get_admin_db() as connection:
                connection.execute("DELETE FROM admin_sessions WHERE token_hash = ?", (token_hash,))
        self.send_response(200)
        self.send_header("Set-Cookie", "twini_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def handle_admin_users(self):
        if not self.require_super_admin():
            return
        with get_admin_db() as connection:
            users = connection.execute("""
                SELECT id, email, role, active, created_at
                FROM admin_users ORDER BY id
            """).fetchall()
        self.send_json(200, {"users": [dict(user) for user in users]})

    def handle_admin_create_user(self, payload):
        if not self.require_super_admin():
            return
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))
        role = str(payload.get("role", "editor"))
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            self.send_json(400, {"error": "Alamat email tidak valid."})
            return
        if len(password) < 10 or len(password) > 256 or role not in {"admin", "editor", "viewer"}:
            self.send_json(400, {"error": "Password minimal 10 karakter dan role harus valid."})
            return
        salt, password_hash = hash_admin_password(password)
        try:
            with get_admin_db() as connection:
                cursor = connection.execute("""
                    INSERT INTO admin_users (email, role, password_salt, password_hash)
                    VALUES (?, ?, ?, ?)
                """, (email, role, salt, password_hash))
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            self.send_json(409, {"error": "Email sudah terdaftar."})
            return
        self.send_json(201, {"user": {"id": user_id, "email": email, "role": role, "active": 1}})

    def handle_admin_update_user(self, user_id, payload):
        if not self.require_super_admin():
            return
        if set(payload) - {"role", "active"}:
            self.send_json(400, {"error": "Perubahan pengguna tidak valid."})
            return
        with get_admin_db() as connection:
            target = connection.execute("SELECT id, role, active FROM admin_users WHERE id = ?", (user_id,)).fetchone()
            if not target:
                self.send_json(404, {"error": "Pengguna tidak ditemukan."})
                return
            role = payload.get("role", target["role"])
            active = payload.get("active", bool(target["active"]))
            if role not in {"super_admin", "admin", "editor", "viewer"} or not isinstance(active, bool):
                self.send_json(400, {"error": "Role atau status pengguna tidak valid."})
                return
            if target["role"] == "super_admin" and (role != "super_admin" or not active):
                super_admin_count = connection.execute(
                    "SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin' AND active = 1"
                ).fetchone()[0]
                if super_admin_count <= 1:
                    self.send_json(409, {"error": "Super admin aktif terakhir tidak dapat dinonaktifkan atau diturunkan rolenya."})
                    return
            connection.execute("UPDATE admin_users SET role = ?, active = ? WHERE id = ?", (role, int(active), user_id))
        self.send_json(200, {"ok": True})

    def handle_city_info(self):
        city = parse_qs(urlsplit(self.path).query).get("city", [""])[0]
        if city not in CITY_INFO:
            self.send_json(400, {"error": "Kota tidak dikenal."})
            return

        try:
            with ThreadPoolExecutor(max_workers=2) as executor:
                news_future = executor.submit(self.fetch_city_news, city)
                weather_future = executor.submit(self.fetch_city_weather, CITY_INFO[city])
                articles = news_future.result(timeout=14)
                weather = weather_future.result(timeout=14)
            self.send_json(200, {
                "city": city,
                "updatedAt": datetime.now(timezone.utc).isoformat(),
                "articles": articles,
                "weather": weather,
                "population": CITY_INFO[city]["population"],
                "populationScope": CITY_INFO[city]["populationScope"],
                "populationSource": "BPS SP2020",
                "wage": CITY_INFO[city]["wage"],
                "wageLabel": CITY_INFO[city]["wageLabel"],
                "wageYear": CITY_INFO[city]["wageYear"]
            })
        except Exception as error:
            self.send_json(502, {"error": "Informasi kota sementara tidak tersedia."})

    def fetch_city_news(self, city):
        query = f'"{city}" (viral OR ramai OR trending) when:7d'
        feed_url = "https://news.google.com/rss/search?" + urlencode({
            "q": query, "hl": "id", "gl": "ID", "ceid": "ID:id"
        })
        request = Request(feed_url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; TwiniCity/1.0)",
            "Accept": "application/rss+xml, application/xml"
        })
        with urlopen(request, timeout=12) as response:
            root = ET.fromstring(response.read())

        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        articles = []
        for item in root.findall("./channel/item"):
            title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            description = html.unescape(re.sub(r"<[^>]*>", " ", item.findtext("description", "")))
            source = item.findtext("source", "Google News").strip()
            try:
                published = parsedate_to_datetime(item.findtext("pubDate", "").strip())
                if published.tzinfo is None:
                    published = published.replace(tzinfo=timezone.utc)
            except (TypeError, ValueError, OverflowError):
                continue
            article_text = f"{title} {description}".casefold()
            city_match = any(alias in article_text for alias in CITY_ALIASES[city])
            if not title or not link or not city_match or published.astimezone(timezone.utc) < cutoff:
                continue
            articles.append({
                "title": title,
                "source": source or "Google News",
                "publishedAt": published.astimezone(timezone.utc).isoformat(),
                "url": link
            })
            if len(articles) == 5:
                break
        return articles

    def fetch_city_weather(self, city_data):
        weather_url = "https://api.open-meteo.com/v1/forecast?" + urlencode({
            "latitude": city_data["lat"],
            "longitude": city_data["lng"],
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature",
            "timezone": "auto"
        })
        request = Request(weather_url, headers={"User-Agent": "TwiniCity/1.0"})
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read())
        current = payload.get("current", {})
        return {
            "temperature": current.get("temperature_2m"),
            "apparentTemperature": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "observedAt": current.get("time")
        }

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), TwiniHandler)
    print(f"Twini Twin City: http://localhost:{PORT}/")
    server.serve_forever()