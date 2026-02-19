import unittest
import os
import sys
import json
import hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flat_file_db import (
    create_user, get_user, clear_db, _kryptér, _dekryptér
)
from flat_file_db import DB_FILE

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class TestKryptering(unittest.TestCase):
    # Given: En tom database
    # When: Vi opretter en bruger
    # Then: Persondata er krypteret og password er hashed

    def setUp(self):
        clear_db()

    def test_persondata_krypteres_inden_det_gemmes(self):
        # Risiko: Hvis testen fejler gemmes persondata i klartekst –
        # GDPR-brud og alvorlig sikkerhedsrisiko

        # Given: En tom database
        # When: Vi opretter en bruger
        create_user("diaco", "sabir", "næstved", "1", "diaco123")

        # Then: I databasen er felterne krypteret – ikke klartekst
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        gemt = data[0]
        self.assertNotEqual(gemt["first_name"],    "diaco")
        self.assertNotEqual(gemt["last_name"],     "sabir")
        self.assertNotEqual(gemt["address"],       "næstved")
        self.assertNotEqual(gemt["street_number"], "1")

    def test_persondata_dekrypteres_naar_det_hentes(self):
        # Risiko: Hvis testen fejler returneres krypteret data til brugeren –
        # applikationen viser ulæselig tekst i stedet for rigtige navne

        create_user("diaco", "sabir", "næstved", "1", "diaco123")
        user = get_user(1)

        self.assertEqual(user["first_name"],    "diaco")
        self.assertEqual(user["last_name"],     "sabir")
        self.assertEqual(user["address"],       "næstved")
        self.assertEqual(user["street_number"], "1")

    def test_password_gemmes_som_hash(self):
        user = create_user("diaco", "sabir", "næstved", "1", "diaco123")

        self.assertEqual(user["password"], _hash_password("diaco123"))
        self.assertNotEqual(user["password"], "diaco123")

    def test_krypteret_tekst_kan_dekrypteres_tilbage(self):
        original = "næstved"
        resultat = _dekryptér(_kryptér(original))
        self.assertEqual(resultat, original)

    def test_dekrypteret_data_fjernes_fra_hukommelsen(self):
        create_user("diaco", "sabir", "næstved", "1", "diaco123")
        user = get_user(1)
        fornavn = user["first_name"]
        del user
        del fornavn

        self.assertFalse("user" in dir())
        self.assertFalse("fornavn" in dir())


if __name__ == "__main__":
    unittest.main(verbosity=2)
