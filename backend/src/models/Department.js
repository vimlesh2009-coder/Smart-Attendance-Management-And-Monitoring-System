const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
      maxlength: [150, 'Department name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [10, 'Department code cannot exceed 10 characters'],
      // e.g. "CSE", "ECE", "ME"
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // References a user with role 'hod'
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
    establishedYear: {
      type: Number,
      min: [1900, 'Invalid year'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
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
departmentSchema.index({ hod: 1 });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
