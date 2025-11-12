const mongoose  = require("mongoose");
const stream = require("node:stream");

const submissionSchema = new mongoose.Schema({
    title: String,
    questionDetails : {
        titleSlug: {
            type: String,
            nullable : true,
        },
        questionNo : String,
        link : String,
        timestamp: Number,
        statusDisplay: String,
        difficulty : {
            type : String,
            enum : ['Easy', 'Medium', 'Hard'],
        },
    },
    lang: String,
    attempts : Number,
    passedAttempts : Number,
    failedAttempts : Number,
    platform : String,
    solveTime : Number,
    approach : [],
    notes : [],
    description : [{
        type : String,
    }],
    remarks : {
        needWorking : {
            type : Boolean,
            default : false,
        },
        sawSolution : {
            type : Boolean,
            default : false,
        },
        canDoBetter : {
            type : Boolean,
            default : false,
        }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});



const Submission = mongoose.model("Submission", submissionSchema);
module.exports = Submission;