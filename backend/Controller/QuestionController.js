const Submission = require("../Model/Submission");
const User = require("../Model/User");
const mongoose = require("mongoose");

async function getUserQuestions(req, res) {
    try {
        const user = req.user;
        const limit = Math.max(parseInt(req.query.limit) || 10, 1);
        const lastId = req.query.lastId;

        const query = { user: user._id };
        if (lastId) query._id = { $lt: lastId };

        const submissions = await Submission.find(query)
            .sort({ "questionDetails.timestamp": -1 })
            .limit(limit);

        const nextCursor = submissions.length > 0
            ? submissions[submissions.length - 1]._id
            : null;

        res.status(200).json({
            submissions,
            nextCursor,
            hasMore: !!nextCursor
        });
    } catch (e) {
        console.error("error in getUserQuestions:", e);
        res.status(500).json({ error: "Server Error" });
    }
}

async function getSubmissionById(req, res) {
    try {
        const {submissionId} = req.params;
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({message: "Submission not found"});
        }
        res.status(200).json({submission});
    } catch (e) {
        console.error("error in getSubmissionById:", e);
        res.status(500).json({error: "Server Error"});
    }
}

async function updateSubmissionDetails(req, res) {
    try {
        const {submissionId} = req.params;
        const {difficulty, solveTime, approach, notes, description, remarks } = req.body;

        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({message: "Submission not found"});
        }

        submission.questionDetails.difficulty = difficulty || submission.questionDetails.difficulty;
        submission.solveTime = solveTime || submission.solveTime;
        submission.approach = approach || submission.approach;
        submission.notes = notes || submission.notes;
        submission.description = description || submission.description;

        const { needWorking, sawSolution, canDoBetter } = remarks || {};

        submission.remarks.needWorking = needWorking !== undefined ? needWorking : submission.remarks.needWorking;
        submission.remarks.sawSolution = sawSolution !== undefined ? sawSolution : submission.remarks.sawSolution;
        submission.remarks.canDoBetter = canDoBetter !== undefined ? canDoBetter : submission.remarks.canDoBetter;
        await submission.save();

        res.status(200).json({message: "Submission updated successfully", submission});
    } catch (e) {
        console.error("error in updateSubmissionDetails:", e);
        res.status(500).json({error: "Server Error"});
        }
}

async function searchSubmission(req, res) {
    try {
        const user = req.user;
        const { platform, title, status, lang, limit, lastTimestamp } = req.query;

        const perPage = Math.max(parseInt(limit) || 10, 1);

        // Base query
        const query = { user: user._id };

        if (platform) query.platform = { $regex: platform, $options: "i" };
        if (title) query.title = { $regex: title, $options: "i" };
        if (status) query["questionDetails.statusDisplay"] = { $regex: status, $options: "i" };
        if (lang) query.lang = { $regex: lang, $options: "i" };

        // If cursor is provided, only fetch older submissions
        if (lastTimestamp) {
            query["questionDetails.timestamp"] = { $lt: parseInt(lastTimestamp) };
        }

        const submissions = await Submission.find(query)
            .select("title platform lang questionDetails")
            .sort({ "questionDetails.timestamp": -1 })
            .limit(perPage);

        const nextCursor =
            submissions.length > 0
                ? submissions[submissions.length - 1].questionDetails.timestamp
                : null;

        const platformStats = await Submission.aggregate([
            { $match: { user: user._id } },
            { $group: { _id: "$platform", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            submissions,
            nextCursor,
            hasMore: !!nextCursor,
            filters: {
                platform: platform || "all",
                title: title || null,
                status: status || null,
                lang: lang || null,
            },
            platformStats,
        });
    } catch (e) {
        console.error("error in searchSubmission:", e);
        res.status(500).json({ error: "Server Error" });
    }
}


module.exports = { getUserQuestions, updateSubmissionDetails, getSubmissionById, searchSubmission };

