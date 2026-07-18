const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null/missing initially during Google sign-up before onboarding
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: 'Hey there! I am using EcoChat.',
      maxLength: 150,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
