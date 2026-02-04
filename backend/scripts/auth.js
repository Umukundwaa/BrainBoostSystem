const bcrypt = require("bcrypt");

// hash password before saving to database
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);

}
    function verifyUser(req, res, next) {
        const userId = req.headers["user-id"];

        if (!userId) {
            return res.status(401).json({ message: "User not logged in" });
        }

        req.user = { id: userId };
        next();
    }

// compare password during login
async function comparePassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
}

module.exports = {
    hashPassword,
    comparePassword,
    verifyUser
};