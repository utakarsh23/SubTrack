const express = require ("express");
const { getUserProfile, addPlatforms }  = require( "../Controller/UserController");
const { isUserAuthenticated } = require("../Middleware/UserAuth")

const router = express.Router();

router.get("/profile", isUserAuthenticated, getUserProfile);

router.post("/add/platform", isUserAuthenticated, addPlatforms);


module.exports = router;