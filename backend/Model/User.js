const mongoose  = require("mongoose");

const userSchema = new mongoose.Schema({
    username : String,
    email : String,
    password : String,
    platform : {
        leetcodeUsername : String,
        codeChef : String,
        codeForces : String,
    },
    questionsSolved : {
        type : Number,
        default : 0,
    },
    submissions : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Submission",
    }],
});



const User = mongoose.model("User", userSchema);
module.exports = User;