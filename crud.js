let users = [];

function createUser(username, password) {
    if (password.length < 8) return false;
    users.push({ username, password });
    return true;
}

function readUser(username) {
    return users.find(u => u.username === username);
}

function updatePassword(username, newPassword) {
    const user = readUser(username);
    if (!user || newPassword.length < 8) return false;
    user.password = newPassword;
    return true;
}

function deleteUser(username) {
    users = users.filter(u => u.username !== username);
}
console.log("CRUD test – Password system\n");

// CREATE
console.log("Create valid user:", createUser("bob", "12345678")); // true
console.log("Create invalid user:", createUser("eva", "1234567")); // false

// READ
console.log("Read existing user:", readUser("bob"));
console.log("Read non-existing user:", readUser("eva")); // undefined

// UPDATE
console.log("Update with valid password:", updatePassword("bob", "nytpass123")); // true
console.log("Update with invalid password:", updatePassword("bob", "kort")); // false

// DELETE
deleteUser("bob");
console.log("Read after delete:", readUser("bob")); // undefined
