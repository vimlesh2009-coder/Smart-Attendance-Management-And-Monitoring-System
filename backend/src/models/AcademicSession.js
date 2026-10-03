const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      unique: true,
      // e.g. "2024-2025 Even Semester" or "2024-2025 Odd Semester"
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      // e.g. "2024-2025"
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'],
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      enum: ['odd', 'even'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    totalWorkingDays: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Validation: endDate must be after startDate
academicSessionSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Virtual: duration in days
academicSessionSchema.virtual('durationDays').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema);
module.exports = AcademicSession;
