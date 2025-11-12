const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://www.codechef.com";

const parseTimestamp = (str) => {
    if (!str) return null;
    try {
        const [time, meridian, date] = str.split(" ");
        const [day, month, year] = date.split("/").map(Number);

        let [hour, minute] = time.split(":").map(Number);
        if (meridian.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (meridian.toUpperCase() === "AM" && hour === 12) hour = 0;

        const fullYear = 2000 + year;
        const parsed = new Date(fullYear, month - 1, day, hour, minute, 0);

        return Math.floor(parsed.getTime() / 1000);
    } catch (e) {
        console.error("Timestamp parse failed for:", str);
        return null;
    }
};

const parseSubmissions = (html) => {
    const $ = cheerio.load(html);
    const rows = $("table.dataTable tbody tr");
    const submissions = [];

    rows.each((_, row) => {
        const cols = $(row).find("td");
        if (cols.length < 5) return;

        const timeStr = $(cols[0]).attr("title")?.trim();
        const timestamp = parseTimestamp(timeStr);

        const title = $(cols[1]).attr("title")?.trim();
        const href = $(cols[1]).find("a").attr("href");
        if (!href) return;

        const link = BASE_URL + href;
        const titleSlug = href.split("/").pop();

        const rawStatus = $(cols[2]).find("span").attr("title")?.toLowerCase() || "unknown";
        let statusDisplay = "unknown";

        if (rawStatus.includes("accepted")) statusDisplay = "accepted";
        else if (rawStatus.includes("partially")) statusDisplay = "partially accepted";
        else if (rawStatus.includes("wrong")) statusDisplay = "wrong answer";
        else if (rawStatus.includes("time")) statusDisplay = "time limit exceeded";
        else if (rawStatus.includes("runtime")) statusDisplay = "runtime error";
        else if (rawStatus.includes("compile")) statusDisplay = "compile error";

        
        const lang = $(cols[3]).attr("title")?.trim();

        submissions.push({
            title,
            questionDetails: {
                titleSlug,
                questionNo: null,
                link,
                timestamp,
                statusDisplay,
                difficulty: null,
            },
            lang,
        });
    });

    return submissions;
};

const fetchPage = async (username, page = 1) => {

    const url = `${BASE_URL}/recent/user?page=${page}&user_handle=${username}`;

    const { data } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
            "X-Requested-With": "XMLHttpRequest",
        },
    });

    if (data && data.content) return data.content;
    return data;
};

async function fetchRecentCodeChefSubmissions (username) {
    const limit = 30;
    let all = [];
    let page = 1;

    const seen = new Set();

    while (all.length < limit) {
        const html = await fetchPage(username, page);
        const parsed = parseSubmissions(html);

        if (!parsed.length) break;
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));

        for (const sub of parsed) {
            const key = sub.questionDetails.link || sub.questionDetails.timestamp;
            if (!seen.has(key)) {
                seen.add(key);
                all.push(sub);
            }
        }

        page++;
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    }

    return all;
};

module.exports = { fetchRecentCodeChefSubmissions };