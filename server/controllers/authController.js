const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getFrontendUrl = () => {
  if (process.env.CLIENT_URL && process.env.CLIENT_URL.trim()) {
    const configuredUrl = process.env.CLIENT_URL.trim();
    if (configuredUrl !== 'http://localhost:5173' || process.env.NODE_ENV !== 'production') {
      return configuredUrl;
    }
  }

  return process.env.NODE_ENV === 'production' ? 'https://eco-chat-eight.vercel.app' : 'http://localhost:5173';
};

const frontendUrl = getFrontendUrl();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'default_super_secret_jwt_access_token_key_ecochat_2026',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'default_super_secret_jwt_refresh_token_key_ecochat_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

// Cookie configuration helper
const getCookieOptions = (maxAgeMs) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: maxAgeMs,
  };
};

// Format username helper
const formatUsername = (username) => {
  if (!username) return '';
  let formatted = username.trim().toLowerCase();
  if (!formatted.startsWith('@')) {
    formatted = '@' + formatted;
  }
  return formatted;
};

// Register User (Email/Password)
const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const formattedUsername = formatUsername(username);

  // Validate username format
  const usernameRegex = /^@[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(formattedUsername)) {
    return res.status(400).json({
      success: false,
      message: 'Username must start with @ and be 3-20 characters long (alphanumeric & underscores)',
    });
  }

  try {
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const usernameExists = await User.findOne({ username: formattedUsername });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      username: formattedUsername,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      onlineStatus: 'offline',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        about: user.about,
        onlineStatus: user.onlineStatus,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// Login User (Email/Password)
const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const input = emailOrUsername.trim().toLowerCase();
    const formattedUsername = input.startsWith('@') ? input : '@' + input;

    const user = await User.findOne({
      $or: [{ email: input }, { username: formattedUsername }],
    });

    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        about: user.about,
        onlineStatus: user.onlineStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Passport Google Login Callback Handler
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    if (!user.username) {
      return res.redirect(`${frontendUrl}/onboarding`);
    }
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('Google callback controller error:', error);
    return res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};

// Get current logged-in user profile
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// Refresh Access Token
const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'default_super_secret_jwt_refresh_token_key_ecochat_2026');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie('accessToken', newAccessToken, getCookieOptions(15 * 60 * 1000));

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token expired or invalid' });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.refreshToken = '';
        user.onlineStatus = 'offline';
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleCallback,
  getMe,
  refreshAccessToken,
  logoutUser,
};
