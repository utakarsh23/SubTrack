const express = require ("express");
const { getPublicUserProfile }  = require( "../Controller/UserController");
const { userLogin, signupUser }  = require( "../Controller/PublicController");
const { isUserAuthenticated } = require("../Middleware/UserAuth")

const router = express.Router();

router.post("/login", userLogin);

router.post("/signup", signupUser);

router.get("/profile/:id", getPublicUserProfile);

module.exports = router;