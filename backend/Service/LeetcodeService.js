const axios = require("axios");

const fetchRecentLeetCodeSubmissions = async (username) => {
    const url = `https://alfa-leetcode-api.onrender.com/${username}/submission`;
    const { data } = await axios.get(url);
    return data.submission;
};

const fetchLeetCodeQuestionDetails = async (titleSlug) => {
    const url = `https://alfa-leetcode-api.onrender.com/select?titleSlug=${titleSlug}`;
    const { data } = await axios.get(url);
    return {
        link: data.link,
        difficulty: data.difficulty,
        topics: data.topicTags.map((t) => t.name).join(", "),
    };
};

module.exports = {fetchRecentLeetCodeSubmissions, fetchLeetCodeQuestionDetails};