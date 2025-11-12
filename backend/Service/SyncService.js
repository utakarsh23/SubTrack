const cron = require("node-cron");
const {fetchLeetCodeQuestionDetails, fetchRecentLeetCodeSubmissions} = require("./LeetcodeService");
const {fetchRecentCodeForcesSubmissions} = require("./CodeForcesService");
const { fetchRecentCodeChefSubmissions } = require("./CodeChefService");
const Submission = require("../Model/Submission");
const User = require("../Model/User");


cron.schedule("18 7 * * *", async () => {
    try {
        const users = await User.find({
            $or: [
                { "platform.leetcodeUsername": { $exists: true, $ne: null, $ne: "" } },
                { "platform.codeForces": { $exists: true, $ne: null, $ne: "" } },
                { "platform.codeChef": { $exists: true, $ne: null, $ne: "" } },
            ]
        });

        const promises = [];
        for (const user of users) {
            if (user.platform.leetcodeUsername) promises.push(fetchLeetCodeSubmissions(user));
            if (user.platform.codeForces) promises.push(fetchCodeForcesSubmissions(user));
            if (user.platform.codeChef) promises.push(
                (async () => {
                    try {
                        await fetchCodeChefSubmissions(user);
                    } catch (err) {
                        console.error(
                            `CodeChef sync failed for ${user.platform.codeChef}:`,
                            err.message
                        );
                    }
                })()
            );
            await Promise.allSettled(promises);
        }
    } catch (err) {
        console.error("Error in scheduled submission sync:", err);
    }
})

async function fetchLeetCodeSubmissions(user) {
    try {
        const username = user?.platform?.leetcodeUsername;
        if (!username) {
            console.log("leetcode username is required");
            return;
        }

        const submissions = await fetchRecentLeetCodeSubmissions(username);

        if (!submissions || submissions.length === 0) {
            console.log("No submissions found");
            return;
        }

        let newCount = 0;

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

        console.log(`LC submissions synced successfully. added ${newCount} problems.`);


    } catch (err) {
        console.error("Error in syncSubmissions:", err);
    }
};

async function fetchCodeForcesSubmissions(user) {
    try {
        const username = user?.platform?.codeForces;

        if (!username) {
            console.log("Codeforces username is required");
            return;
        }

        const apiResponse = await fetchRecentCodeForcesSubmissions(username);
        if (!apiResponse || !apiResponse.result) {
            console.log("Invalid API response from Codeforces");
            return;
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

        console.log(`Codeforces submissions synced successfully. added ${newCount} problems.`);

    } catch (error) {
        console.error("Error in syncCodeforcesSubmissions:", error);
    }
};

async function fetchCodeChefSubmissions(user) {
    try {
        const username = user?.platform?.codeChef;
        if (!username) {
            console.log("CodeChef username is required");
            return;
        }

        const submissions = await fetchRecentCodeChefSubmissions(username);

        if (!submissions || submissions.length === 0) {
            console.log("No submissions found for CodeChef user:", username);
            return;
        }

        let newCount = 0;

        for (const submission of submissions) {
            const { title, questionDetails, lang } = submission;
            const { titleSlug, link, timestamp, statusDisplay } = questionDetails;

            // Check duplicate by timestamp
            const existingTimestamp = await Submission.findOne({
                "questionDetails.timestamp": timestamp,
                user: user._id,
                platform: "CodeChef"
            });
            if (existingTimestamp) continue;

            // Check if same problem exists (for attempt counting)
            const existingQuestion = await Submission.findOne({
                title,
                user: user._id,
                platform: "CodeChef"
            });

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

            // Create new record
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

        console.log(`CodeChef submissions synced successfully for ${username}. Added ${newCount} new problems.`);
        return newCount;

    } catch (err) {
        console.error("Error in fetchCodeChefSubmissions:", err);
    }
}


