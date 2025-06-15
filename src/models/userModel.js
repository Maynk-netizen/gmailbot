import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        trim:true
    },
    email:{
        type:String,
        required:[true,"Please enter a email address"],
        unique:true,
    },
    password:{
        type:String,
        required:[true,"Please enter a password"],
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    forgotPasswordToken:String,
    forgotPasswordTokenExpiry:Date,
    verifyToken:String,
    verifyTokenExpiry:Date
})
const User = mongoose.models.users || mongoose.model("users", userSchema);
export default User;