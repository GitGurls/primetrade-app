const User = require('../models/User');
const { sendTokenResponse, verifyToken, generateAccessToken } = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email already exists.');
    }

    const user = await User.create({ name, email, password, role: 'user' });

    logger.info(`New user registered: ${email}`);
    sendTokenResponse(user, 201, res, 'Account created successfully! Welcome aboard.');

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Check account status
    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been deactivated. Contact support.');
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);
    sendTokenResponse(user, 200, res, 'Logged in successfully!');

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  return successResponse(res, 200, 'Profile fetched successfully', req.user);
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true
  });
  return successResponse(res, 200, 'Logged out successfully.');
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      return errorResponse(res, 401, 'No refresh token provided.');
    }

    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return errorResponse(res, 401, 'Invalid refresh token.');
    }

    const accessToken = generateAccessToken(user._id, user.role);
    return successResponse(res, 200, 'Token refreshed successfully', { accessToken });

  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired refresh token.');
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for: ${user.email}`);
    return successResponse(res, 200, 'Password changed successfully. Please log in again.');

  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, logout, refreshToken, changePassword };
