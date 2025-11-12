const User = require("../Model/User");
const dotenv = require("dotenv");
dotenv.config();


async function addPlatforms(req, res) {
    try {
        const { platforms } = req.body;
        const user = req.user;
        if(!platforms) {
            return res.status(400).json({ message: "Platforms are required" });
        }

        await user.updateOne({ $set : { platform: platforms }});
        return res.status(200).json({ message: "Platforms added successfully" });
    } catch (e) {
        console.log("error in addPlatforms");
        console.log(e);
        return res.status(500).json({ error: "Server Error" });
    }
}

async function getUserProfile(req, res) {
    try {
        const user = req.user;
        return res.status(200).json({ user });
    } catch (e) {
        console.log("error in getUserDetails");
        console.log(e);
        return res.status(500).json({ error: "Server Error" });
    }
}

async function getPublicUserProfile(req, res) {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username }).select("-password");
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (e) {
        console.log("error in getPublicUserProfile");
        console.log(e);
        return res.status(500).json({ error: "Server Error" });
    }
}



module.exports = {
    getUserProfile,
    getPublicUserProfile,
    addPlatforms
};