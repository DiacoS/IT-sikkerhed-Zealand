import json
import os
import hashlib
from cryptography.fernet import Fernet

DB_FILE = "users.json"
KEY_FILE = "secret.key"


def _load_key() -> bytes:
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as f:
            f.write(key)
    with open(KEY_FILE, "rb") as f:
        return f.read()


_fernet = Fernet(_load_key())


def _kryptér(tekst: str) -> str:
    return _fernet.encrypt(tekst.encode()).decode()


def _dekryptér(tekst: str) -> str:
    return _fernet.decrypt(tekst.encode()).decode()


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _load() -> list:
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(data: list) -> None:
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _next_id(data: list) -> int:
    if not data:
        return 1
    return max(user["person_id"] for user in data) + 1


def create_user(first_name, last_name, address, street_number, password, enabled=True) -> dict:
    data = _load()
    user = {
        "person_id":     _next_id(data),
        "first_name":    _kryptér(first_name),
        "last_name":     _kryptér(last_name),
        "address":       _kryptér(address),
        "street_number": _kryptér(street_number),
        "password":      _hash_password(password),
        "enabled":       enabled,
    }
    data.append(user)
    _save(data)
    return get_user(user["person_id"])


def get_user(person_id: int):
    for user in _load():
        if user["person_id"] == person_id:
            dekrypteret = {
                "person_id":     user["person_id"],
                "first_name":    _dekryptér(user["first_name"]),
                "last_name":     _dekryptér(user["last_name"]),
                "address":       _dekryptér(user["address"]),
                "street_number": _dekryptér(user["street_number"]),
                "password":      user["password"],
                "enabled":       user["enabled"],
            }
            return dekrypteret
    return None


def get_all_users() -> list:
    return [get_user(u["person_id"]) for u in _load()]


def update_user(person_id: int, **kwargs):
    data = _load()
    kryptér_felter = {"first_name", "last_name", "address", "street_number"}
    for user in data:
        if user["person_id"] == person_id:
            for key, value in kwargs.items():
                if key == "password":
                    user[key] = _hash_password(value)
                elif key in kryptér_felter:
                    user[key] = _kryptér(value)
                else:
                    user[key] = value
            _save(data)
            return get_user(person_id)
    return None


def delete_user(person_id: int) -> bool:
    data = _load()
    ny_data = [u for u in data if u["person_id"] != person_id]
    if len(ny_data) == len(data):
        return False
    _save(ny_data)
    return True


def clear_db() -> None:
    _save([])