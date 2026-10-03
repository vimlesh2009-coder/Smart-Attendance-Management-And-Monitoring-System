const mongoose = require('mongoose');

/**
 * SubjectAssignment: links Faculty <-> Subject <-> Section <-> AcademicSession
 * This is the core entity for "who teaches what to whom in which session"
 */
const subjectAssignmentSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
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
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// A faculty can only be assigned to the same subject+section+session once
subjectAssignmentSchema.index(
  { faculty: 1, subject: 1, section: 1, academicSession: 1 },
  { unique: true }
);

subjectAssignmentSchema.index({ faculty: 1, academicSession: 1 });
subjectAssignmentSchema.index({ section: 1, academicSession: 1 });
subjectAssignmentSchema.index({ subject: 1, section: 1, academicSession: 1 });

const SubjectAssignment = mongoose.model('SubjectAssignment', subjectAssignmentSchema);
module.exports = SubjectAssignment;
