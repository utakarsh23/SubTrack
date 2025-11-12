const User = require("../Model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;


async function userLogin(req, res) {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ message: "Email and Password are required" });
        }
        const user = await User.findOne({ email: email });
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        const token = jwt.sign({ _id: user._id, email : user.email, username : user.username }, JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ message: "Login Successful", username : user.username , token });
    } catch (err) {
        console.log("error in userLogin");
        console.log(err);
        return res.status(500).json({error: "Server Error"});
    }
}

async function signupUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if(!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email: email, username : username });
        if(existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });
        return res.status(201).json({ message: "User registered successfully" });
    } catch (e) {
        console.log("error in signupUser");
        console.log(e);
        return res.status(500).json({ error: "Server Error" });
    }
}

module.exports = {
    userLogin,
    signupUser
};