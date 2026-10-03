const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'holiday',
        'exam',
        'internal_exam',
        'result',
        'enrollment',
        'fee_deadline',
        'event',
        'workshop',
        'seminar',
        'sports',
        'cultural',
        'working_day',
        'other',
      ],
      default: 'event',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    isWorkingDay: {
      type: Boolean,
      default: true,
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
    // Scope: which departments/sections this applies to
    targetDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    isAllDepartments: {
      type: Boolean,
      default: true,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    organizer: {
      type: String,
      trim: true,
      maxlength: [150, 'Organizer cannot exceed 150 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: '#1976d2',
      // Hex color for frontend calendar display
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: duration in days
calendarEventSchema.virtual('durationDays').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;
});

calendarEventSchema.index({ startDate: 1, endDate: 1 });
calendarEventSchema.index({ academicSession: 1 });
calendarEventSchema.index({ type: 1 });
calendarEventSchema.index({ isHoliday: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
module.exports = CalendarEvent;
