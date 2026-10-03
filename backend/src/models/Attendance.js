const mongoose = require('mongoose');

/**
 * AttendanceRecord: one document per lecture session for a section
 * Contains per-student status entries
 */

const studentAttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      default: 'absent',
    },
    // Audit: who last changed this entry and when
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    // Track corrections
    correctionHistory: [
      {
        previousStatus: {
          type: String,
          enum: ['present', 'absent', 'late', 'excused'],
        },
        newStatus: {
          type: String,
          enum: ['present', 'absent', 'late', 'excused'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [300, 'Reason cannot exceed 300 characters'],
        },
      },
    ],
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    // Context: which lecture this attendance belongs to
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    lectureType: {
      type: String,
      enum: ['lecture', 'practical', 'tutorial'],
      default: 'lecture',
    },
    periodNumber: {
      type: Number,
      min: [1, 'Period number must be at least 1'],
    },
    startTime: {
      type: String,
      // e.g. "09:00"
    },
    endTime: {
      type: String,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: [200, 'Topic cannot exceed 200 characters'],
    },
    // The actual per-student records
    records: {
      type: [studentAttendanceSchema],
      default: [],
    },
    // Summary (auto-calculated)
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    excusedCount: {
      type: Number,
      default: 0,
    },
    // Lock: prevent further edits after N hours
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per subject+section+faculty+date+period
attendanceSchema.index(
  { subject: 1, section: 1, date: 1, periodNumber: 1, faculty: 1 },
  { unique: true }
);

attendanceSchema.index({ section: 1, date: 1 });
attendanceSchema.index({ subject: 1, section: 1, academicSession: 1 });
attendanceSchema.index({ faculty: 1, date: 1 });
attendanceSchema.index({ academicSession: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ 'records.student': 1 });

// Pre-save: update summary counts
attendanceSchema.pre('save', function (next) {
  if (this.isModified('records')) {
    this.totalStudents = this.records.length;
    this.presentCount = this.records.filter((r) => r.status === 'present').length;
    this.absentCount = this.records.filter((r) => r.status === 'absent').length;
    this.lateCount = this.records.filter((r) => r.status === 'late').length;
    this.excusedCount = this.records.filter((r) => r.status === 'excused').length;
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
