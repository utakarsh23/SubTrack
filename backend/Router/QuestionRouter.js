const express = require ("express");
const { getUserQuestions, updateSubmissionDetails, getSubmissionById, searchSubmission }  = require( "../Controller/QuestionController");
const { isUserAuthenticated } = require("../Middleware/UserAuth")

const router = express.Router();

router.get("/getSelf", isUserAuthenticated, getUserQuestions);

router.post("/update/:submissionId", isUserAuthenticated, updateSubmissionDetails);

router.get("/details/:submissionId", isUserAuthenticated, getSubmissionById);

router.get("/search", isUserAuthenticated, searchSubmission);


module.exports = router;