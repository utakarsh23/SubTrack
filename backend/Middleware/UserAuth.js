const User = require("../Model/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

async function isUserAuthenticated(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];


        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded._id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        console.error("Authentication error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}

module.exports = {isUserAuthenticated};
