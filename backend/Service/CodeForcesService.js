const axios = require("axios");

const fetchRecentCodeForcesSubmissions = async (cc_username) => {
    try {
        const url = `https://codeforces.com/api/user.status?handle=${cc_username}&from=1&count=50`;
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error("Error fetching recent submissions:", error);
        return [];
    }
};

module.exports = {fetchRecentCodeForcesSubmissions};