const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      enum: [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Lecturer',
        'Lab Instructor',
        'HOD',
      ],
      default: 'Assistant Professor',
    },
    qualification: {
      type: String,
      trim: true,
      maxlength: [200, 'Qualification cannot exceed 200 characters'],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [200, 'Specialization cannot exceed 200 characters'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Subjects and sections currently assigned (populated each session via SubjectAssignment)
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// employeeId index auto-created by unique:true in schema field
facultySchema.index({ department: 1 });

// Virtual: name from user
facultySchema.virtual('name').get(function () {
  return this.user && this.user.name ? this.user.name : undefined;
});

const Faculty = mongoose.model('Faculty', facultySchema);
module.exports = Faculty;
