import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    // Removed unique: true constraint to allow duplicate usernames
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true, // Keep emails unique
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Add targetEmails field as an array of strings
  targetEmails: {
    type: [String],
    default: [],
  },
  // Add new field for storing messages from target emails
  targetEmailMessages: {
    type: [{
      email: String,
      messageId: String,
      reply: String ,
      subject: String,
      snippet: String,
      date: Date,
      isRead: { type: Boolean, default: false }
    }],
    default: []
  },
  // Add new field for storing email contexts
  emailContexts: {
    type: [{
      targetEmail: String,
      context: String
    }],
    default: []
  },
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
  verifyToken: String,
  verifyTokenExpiry: Date,
}, { timestamps: true });

// Changed model name from User to GoogleUser
const GoogleUser = mongoose.models.GoogleUser || mongoose.model("GoogleUser", userSchema);

export default GoogleUser;