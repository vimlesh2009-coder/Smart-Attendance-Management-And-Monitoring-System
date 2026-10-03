const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    periodNumber: {
      type: Number,
      required: true,
      min: [1, 'Period number must be at least 1'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      // e.g. "09:00"
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['lecture', 'practical', 'tutorial', 'break', 'free'],
      default: 'lecture',
    },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    periods: {
      type: [periodSchema],
      default: [],
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One timetable per section+session+day
timetableSchema.index(
  { section: 1, academicSession: 1, day: 1 },
  { unique: true }
);

timetableSchema.index({ section: 1, academicSession: 1 });
timetableSchema.index({ department: 1, academicSession: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;
