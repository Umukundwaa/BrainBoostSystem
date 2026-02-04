const db = require("../db/db");
const { hashPassword, comparePassword } = require("../scripts/auth");
const bcrypt = require("bcrypt");
// user signup

exports.registerUser = (req, res) => {
    const {username, email, password} = req.body;

    if (!username || ! email || !password){
        return res.status(400).json({ message: "All fields are required"});

    }

    try{

    // check if user exists
    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {

        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length > 0){
            return res.status(400).json({ message: "Email already exists"})
        }
        // hash password
        const hashedPassword = await hashPassword(password);

        // insert user

        const insertUserQuery = "INSERT INTO users (username , email, password) VALUES (?, ?, ?)";
            db.query(insertUserQuery, [username, email , hashedPassword], (err, result) => {

                if(err){
                    return res.status(500).json({ message: "Error creating user" });
                }

                console.log("User created successfully:", {id: result.insertId, username, email});
                return res.status(201).json({ message: "User registered successfully" });
            });
        });
    }
    catch(outerErr){
        console.error("Unexpected error:", outerErr);
        return res.status(500).json({ message: "Unexpected server error"});
    }
};


// USER LOGIN 
exports.loginUser = (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {

        return res.status(400).json({ message: "Email and password are required" });

    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error"});

        if (results.length ===0){
            return res.status(400).json({ message: "Invalid email or password"});
        }

        const user = results[0];
         
        // verify password
        const isMatch = await comparePassword(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const message = `Login successful as ${user.username}✅`;
        return res.status(200).json({
            message ,
            user: {
                id: results[0].id,
                username: results[0].username,
                email: results[0].email
            }
        });
    });
};