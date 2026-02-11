import unittest
import os
import sys
import hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flat_file_db import (
    create_user, get_user, get_all_users,
    update_user, delete_user, clear_db
)

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

class TestCreateUser(unittest.TestCase):
 # Given: En tom database
 # When: Vi opretter en bruger med alle felter
 # Then: Brugeren returneres med korrekte data
    def setUp(self):
        clear_db()

    def test_opret_gyldig_bruger_gemmes_i_databasen(self):
       
        user = create_user("Anders", "Jensen", "Hovedgaden", "12", "password123")

        self.assertEqual(user["first_name"], "Anders")
        self.assertEqual(user["last_name"], "Jensen")
        self.assertEqual(user["address"], "Hovedgaden")
        self.assertEqual(user["street_number"], "12")
        self.assertEqual(user["password"], _hash_password("password123"))
        self.assertTrue(user["enabled"])

    def test_opret_bruger_far_unikt_person_id(self):
       
        user1 = create_user("diaco", "sabir", "næstved", "1", "diaco123")
        user2 = create_user("Sofie", "Møller", "Birkevej", "2", "sofie123")

        # Then: De har hvert sit unikke person_id
        self.assertNotEqual(user1["person_id"], user2["person_id"])

   
class TestGetUser(unittest.TestCase):

    def setUp(self):
        # Given: En database med én bruger
        clear_db()
        create_user("Peter", "Hansen", "Søvej", "5", "kodeord99")

    def test_hent_eksisterende_bruger(self):
        # Risiko: Hvis testen fejler kan brugere ikke hentes –
        # login og profilvisning virker ikke

        # Given: En database med bruger ID 1
        # When: Vi kalder get_user(1)
        result = get_user(1)

        # Then: Den korrekte bruger returneres
        self.assertIsNotNone(result)
        self.assertEqual(result["first_name"], "Peter")

    def test_hent_ikke_eksisterende_bruger_returnerer_none(self):
        # Risiko: Hvis testen fejler crasher systemet på ugyldige ID'er
        # og kan destabilisere applikationen

        # Given: En database uden bruger med ID 999
        # When: Vi kalder get_user(999)
        result = get_user(999)

        # Then: None returneres uden crash
        self.assertIsNone(result)

    def test_hent_alle_brugere_returnerer_liste(self):
       
        create_user("Maria", "Christensen", "Lyngevej", "7", "maria1234")

        alle = get_all_users()

        self.assertEqual(len(alle), 2)
   

class TestUpdateUser(unittest.TestCase):

    def setUp(self):
        clear_db()
        create_user("diaco", "sabir", "næstved", "1", "diaco123")
 # Risiko: Hvis testen fejler kan brugere ikke opdatere adresse –
 # brugerdata bliver forældet og ukorrekt

 # Given: En bruger med address='næstved'
 # When: Vi opdaterer address til 'Nygade'
    def test_opdater_adresse(self):
        updated = update_user(1, address="Nygade")

        self.assertEqual(updated["address"], "Nygade")

    def test_opdater_enabled_status(self):
        update_user(1, enabled=False)
        bruger = get_user(1)

        self.assertFalse(bruger["enabled"])

    def test_opdater_ikke_eksisterende_bruger_returnerer_none(self):
        result = update_user(999, first_name="Ghost")

        self.assertIsNone(result)


class TestDeleteUser(unittest.TestCase):
# Given: En database med én bruger
 # When: Vi sletter bruger ID 1
 # Then: Brugeren slettes og returnerer True
    def setUp(self):
        clear_db()
        create_user("diaco", "sabir", "næstved", "1", "diaco123")

    def test_slet_eksisterende_bruger(self):
        result = delete_user(1)

        self.assertTrue(result)
        self.assertIsNone(get_user(1))

    def test_slet_ikke_eksisterende_bruger_returnerer_false(self):
        result = delete_user(999)

        self.assertFalse(result)

 

if __name__ == "__main__":
    unittest.main(verbosity=2)