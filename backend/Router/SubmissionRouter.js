const express = require ("express");
const { fetchLeetCodeSubmissions, fetchCodeForcesSubmissions, fetchCodeChefSubmissions } = require( "../Controller/submissionController.js");
const {isUserAuthenticated} = require("../Middleware/UserAuth");

const router = express.Router();

router.get("/syncLeetcode", isUserAuthenticated, fetchLeetCodeSubmissions);

router.get("/syncCodeForces", isUserAuthenticated, fetchCodeForcesSubmissions);

router.get("/syncCodeChef", isUserAuthenticated, fetchCodeChefSubmissions);

module.exports = router;