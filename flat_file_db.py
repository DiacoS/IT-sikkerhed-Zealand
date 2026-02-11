import json
import os
import hashlib

DB_FILE = "users.json"

def _load() -> list:
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


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
        "person_id": _next_id(data),
        "first_name": first_name,
        "last_name": last_name,
        "address": address,
        "street_number": street_number,
        "password": _hash_password(password),
        "enabled": enabled,
    }
    data.append(user)
    _save(data)
    return user


def get_user(person_id: int):
    for user in _load():
        if user["person_id"] == person_id:
            return user
    return None


def get_all_users() -> list:
    return _load()


def update_user(person_id: int, **kwargs):
    data = _load()
    for user in data:
        if user["person_id"] == person_id:
            for key, value in kwargs.items():
                user[key] = value
            _save(data)
            return user
    return None


def delete_user(person_id: int) -> bool:
    data = _load()
    new_data = [u for u in data if u["person_id"] != person_id]
    if len(new_data) == len(data):
        return False
    _save(new_data)
    return True


def clear_db() -> None:
    _save([])