const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { generateTokens, buildAuthPayload } = require('../services/authService');
const { createAuditLog } = require('../middleware/auditLogger');
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
  sendBadRequest,
} = require('../utils/apiResponse');

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendUnauthorized(res, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendUnauthorized(res, 'Your account has been deactivated. Contact admin.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await createAuditLog({
        action: 'LOGIN',
        performedBy: user._id,
        performedByRole: user.role,
        description: 'Failed login attempt - wrong password',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure',
      });
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token + update lastLogin
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const payload = await buildAuthPayload(user);

    await createAuditLog({
      action: 'LOGIN',
      performedBy: user._id,
      performedByRole: user.role,
      description: `User logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });

    return sendSuccess(res, { user: payload, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    await createAuditLog({
      action: 'LOGOUT',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      description: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendBadRequest(res, 'Refresh token is required');

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return sendUnauthorized(res, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return sendUnauthorized(res, 'Refresh token is invalid or revoked');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const payload = await buildAuthPayload(req.user);
    return sendSuccess(res, payload, 'Profile fetched');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendBadRequest(res, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      action: 'PASSWORD_CHANGE',
      performedBy: user._id,
      performedByRole: user.role,
      description: 'Password changed successfully',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return sendSuccess(res, {}, 'Password changed successfully. Please log in again.');
  } catch (err) {
    return sendError(res, err.message);
  }
};

// ─── PUT /api/auth/update-profile ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone'];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, user, 'Profile updated');
  } catch (err) {
    return sendError(res, err.message);
  }
};

module.exports = { login, logout, refreshToken, getMe, changePassword, updateProfile };
