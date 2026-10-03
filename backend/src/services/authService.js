const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

/**
 * Generate access + refresh tokens for a user
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
  return { accessToken, refreshToken };
};

/**
 * Get the role-specific profile linked to a user
 */
const getRoleProfile = async (user) => {
  if (user.role === 'student') {
    return Student.findOne({ user: user._id })
      .populate('department', 'name code')
      .populate('section', 'name year semester')
      .populate('academicSession', 'name academicYear');
  }
  if (user.role === 'faculty' || user.role === 'hod') {
    return Faculty.findOne({ user: user._id }).populate('department', 'name code');
  }
  return null;
};

/**
 * Build the response payload for logged-in user
 */
const buildAuthPayload = async (user) => {
  const profile = await getRoleProfile(user);
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    profile,
  };
};

module.exports = { generateTokens, getRoleProfile, buildAuthPayload };
