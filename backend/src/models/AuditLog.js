const mongoose = require('mongoose');

/**
 * AuditLog: tracks all sensitive actions in the system
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'PASSWORD_CHANGE',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'STUDENT_CREATED',
        'STUDENT_UPDATED',
        'FACULTY_CREATED',
        'FACULTY_UPDATED',
        'ATTENDANCE_MARKED',
        'ATTENDANCE_CORRECTED',
        'ATTENDANCE_LOCKED',
        'FEE_CREATED',
        'FEE_UPDATED',
        'SUBJECT_ASSIGNED',
        'SUBJECT_UNASSIGNED',
        'SESSION_CREATED',
        'SESSION_UPDATED',
        'DEPARTMENT_CREATED',
        'SECTION_CREATED',
        'TIMETABLE_CREATED',
        'TIMETABLE_UPDATED',
        'ANNOUNCEMENT_CREATED',
        'CALENDAR_EVENT_CREATED',
        'DATA_EXPORT',
        'OTHER',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByRole: {
      type: String,
      enum: ['admin', 'faculty', 'hod', 'student'],
    },
    targetModel: {
      type: String,
      // e.g. 'Attendance', 'Student', 'User'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      // ID of the affected document
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      // { field: { from: old, to: new } }
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
