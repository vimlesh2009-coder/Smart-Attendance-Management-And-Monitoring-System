const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      // e.g. "A", "B", "C"
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
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be at least 1'],
      max: [5, 'Year cannot exceed 5'],
      // Year of study: 1, 2, 3, 4
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [10, 'Semester cannot exceed 10'],
    },
    maxStrength: {
      type: Number,
      default: 60,
      min: [1, 'Max strength must be at least 1'],
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique section per dept + session + year + name
sectionSchema.index(
  { department: 1, academicSession: 1, year: 1, name: 1 },
  { unique: true }
);

sectionSchema.index({ department: 1 });
sectionSchema.index({ academicSession: 1 });

const Section = mongoose.model('Section', sectionSchema);
module.exports = Section;
