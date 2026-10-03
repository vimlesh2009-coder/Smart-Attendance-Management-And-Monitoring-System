const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [150, 'Subject name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    type: {
      type: String,
      enum: ['theory', 'practical', 'elective', 'lab'],
      default: 'theory',
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [0, 'Credits cannot be negative'],
      max: [10, 'Credits cannot exceed 10'],
    },
    weeklyLectures: {
      type: Number,
      default: 3,
      min: [0, 'Weekly lectures cannot be negative'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1],
      max: [5],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1],
      max: [10],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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

// code index auto-created by unique:true in schema field
subjectSchema.index({ department: 1 });
subjectSchema.index({ department: 1, year: 1, semester: 1 });

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
