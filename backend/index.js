const express = require("express");
const dotenv  = require("dotenv");
const { connectMongoDB }  = require("./db/connection");
const SubmissionRouter  = require("./Router/SubmissionRouter");
const QuestionRouter  = require("./Router/QuestionRouter");
const PublicRouter  = require("./Router/PublicRouter");
const UserRouter  = require("./Router/UserRouter");
const { jsonParser }  = require("./Middleware/index");
const cors = require("cors");
dotenv.config();
require("./Service/SyncService");


const app = express();
app.use(jsonParser());

connectMongoDB("mongodb://127.0.0.1:27017/QuestionsFetching")
    .then(() => console.log("MongoDB Connected!!"))
    .catch((err) => console.log("Error, Can't connect to DB", err));


//cors here
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use("/submissions", SubmissionRouter);
app.use("/question", QuestionRouter);
app.use("/public", PublicRouter);
app.use("/user", UserRouter);


app.get("/health", (req, res) => {
    return res.status(200).json({message : "Ok"})
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));