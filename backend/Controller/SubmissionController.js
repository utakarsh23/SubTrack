const Submission = require("../Model/Submission");
const User = require("../Model/User");
const { fetchRecentLeetCodeSubmissions, fetchLeetCodeQuestionDetails } = require("../Service/leetcodeService");
const { fetchRecentCodeForcesSubmissions } = require("../Service/CodeForcesService");
const { fetchRecentCodeChefSubmissions } = require("../Service/CodeChefService");

async function fetchLeetCodeSubmissions(req, res) {
    try {
        const username = req.user?.platform?.leetcodeUsername;
        const user = req.user;
        if (!username) {
            return res.status(400).json({ message: "leetcode username is required" });
        }

        const submissions = await fetchRecentLeetCodeSubmissions(username);

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found" });
        }

        let newCount = 0;

        let i = 0
        for (const submission of submissions) {
            const { title, titleSlug, timestamp, statusDisplay, lang } = submission;

            const existing = await Submission.findOne({ "questionDetails.timestamp": timestamp });
            if (existing) {
                break;
            }

            const details = await fetchLeetCodeQuestionDetails(titleSlug);

            const existingQuestion = await Submission.findOne({ title : title });

            if (existingQuestion) {
                existingQuestion.attempts = (existingQuestion.attempts || 0) + 1;
                if (statusDisplay.toLowerCase() === "accepted") {
                    existingQuestion.passedAttempts = (existingQuestion.passedAttempts || 0) + 1;
                } else {
                    existingQuestion.failedAttempts = (existingQuestion.failedAttempts || 0) + 1;
                }
                await existingQuestion.save();
                continue;
            }

            const newSubmission = await Submission.create({
                title,
                questionDetails: {
                    titleSlug,
                    link: details.link,
                    difficulty: details.difficulty,
                    timestamp,
                    statusDisplay,
                },
                lang,
                platform: "LeetCode",
                attempts: 1,
                passedAttempts: statusDisplay.toLowerCase() === "accepted" ? 1 : 0,
                failedAttempts: statusDisplay.toLowerCase() === "accepted" ? 0 : 1,
                user : user._id,
            });
            await User.findByIdAndUpdate(user._id, { $push: { submissions: newSubmission._id } });
            newCount++;

        }

        return res.status(200).json({
            message: `LeetCode Sync completed successfully.`,
            newAdded: newCount,
        });

    } catch (err) {
        console.error("Error in syncSubmissions:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


async function fetchCodeForcesSubmissions(req, res) {
    try {
        const username = req.user?.platform?.codeForces;
        const user = req.user;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const apiResponse = await fetchRecentCodeForcesSubmissions(username);
        if (!apiResponse || !apiResponse.result) {
            return res.status(404).json({ message: "No submissions found" });
        }

        const submissions = apiResponse.result;
        let newCount = 0;

        for (const submission of submissions) {
            const {
                id,
                contestId,
                creationTimeSeconds,
                programmingLanguage,
                verdict,
                problem,
            } = submission;

            const { name, index, rating, tags } = problem || {};

            const existing = await Submission.findOne({ "questionDetails.timestamp": creationTimeSeconds });
            if (existing) break;

            const titleSlug = `${contestId}-${index}`;
            const existingQuestion = await Submission.findOne({ title : name });

            if (existingQuestion) {
                existingQuestion.attempts = (existingQuestion.attempts || 0) + 1;
                if (verdict === "OK") {
                    existingQuestion.passedAttempts = (existingQuestion.passedAttempts || 0) + 1;
                } else {
                    existingQuestion.failedAttempts = (existingQuestion.failedAttempts || 0) + 1;
                }
                await existingQuestion.save();
                continue;
            }

            const newSubmission = await Submission.create({
                title: name,
                questionDetails: {
                    titleSlug,
                    link: `https://codeforces.com/contest/${contestId}/problem/${index}`,
                    timestamp: creationTimeSeconds,
                    statusDisplay: verdict,
                    difficulty: rating ? (
                        rating < 1300 ? "Easy" :
                            rating < 1800 ? "Medium" :
                                "Hard"
                    ) : undefined,
                },
                lang: programmingLanguage,
                platform: "Codeforces",
                attempts: 1,
                passedAttempts: verdict === "OK" ? 1 : 0,
                failedAttempts: verdict === "OK" ? 0 : 1,
                user : user._id,
            });
            await User.findByIdAndUpdate(user._id, { $push: { submissions: newSubmission._id } });
            newCount++;
        }

        return res.status(200).json({
            message: "Codeforces submissions synced successfully.",
            newAdded: newCount,
        });

    } catch (error) {
        console.error("Error in syncCodeforcesSubmissions:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


async function fetchCodeChefSubmissions(req, res) {
    try {
        const username = req.user?.platform?.codeChef;
        const user = req.user;

        if (!username) {
            return res.status(400).json({ message: "CodeChef username is required" });
        }

        const submissions = await fetchRecentCodeChefSubmissions(username);

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: "No submissions found" });
        }

        let newCount = 0;

        for (const submission of submissions) {
            const { title, questionDetails, lang } = submission;
            const { titleSlug, link, timestamp, statusDisplay } = questionDetails;

            const existingTimestamp = await Submission.findOne({ "questionDetails.timestamp": timestamp });
            if (existingTimestamp) continue;

            const existingQuestion = await Submission.findOne({ title });
            if (existingQuestion) {
                existingQuestion.attempts = (existingQuestion.attempts || 0) + 1;

                if (statusDisplay.toLowerCase().includes("accept")) {
                    existingQuestion.passedAttempts = (existingQuestion.passedAttempts || 0) + 1;
                } else {
                    existingQuestion.failedAttempts = (existingQuestion.failedAttempts || 0) + 1;
                }

                await existingQuestion.save();
                continue;
            }

            const newSubmission = await Submission.create({
                title,
                questionDetails: {
                    titleSlug,
                    link,
                    timestamp,
                    statusDisplay,
                },
                lang,
                platform: "CodeChef",
                attempts: 1,
                passedAttempts: statusDisplay.toLowerCase().includes("accept") ? 1 : 0,
                failedAttempts: statusDisplay.toLowerCase().includes("accept") ? 0 : 1,
                user: user._id,
            });

            await User.findByIdAndUpdate(user._id, {
                $push: { submissions: newSubmission._id },
            });

            newCount++;
        }

        return res.status(200).json({
            message: "CodeChef submissions synced successfully.",
            newAdded: newCount,
        });

    } catch (err) {
        console.error("Error in fetchCodeChefSubmissions:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = { fetchLeetCodeSubmissions, fetchCodeForcesSubmissions, fetchCodeChefSubmissions };

