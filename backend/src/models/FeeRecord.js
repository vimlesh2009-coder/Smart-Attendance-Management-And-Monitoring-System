const mongoose = require('mongoose');

const feeInstallmentSchema = new mongoose.Schema(
  {
    installmentNo: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
    receiptNo: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [300, 'Remarks cannot exceed 300 characters'],
    },
  },
  { _id: true }
);

const feeRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    academicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: [true, 'Academic session is required'],
    },
    feeType: {
      type: String,
      required: [true, 'Fee type is required'],
      enum: [
        'tuition',
        'examination',
        'library',
        'laboratory',
        'hostel',
        'transport',
        'sports',
        'miscellaneous',
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    fine: {
      type: Number,
      default: 0,
      min: [0, 'Fine cannot be negative'],
    },
    installments: {
      type: [feeInstallmentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overdue'],
      default: 'unpaid',
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: balance due
feeRecordSchema.virtual('balanceDue').get(function () {
  return Math.max(0, this.totalAmount + this.fine - this.discount - this.paidAmount);
});

// Auto-update status before save
feeRecordSchema.pre('save', function (next) {
  const netPayable = this.totalAmount + this.fine - this.discount;
  if (this.paidAmount <= 0) {
    this.status = 'unpaid';
  } else if (this.paidAmount >= netPayable) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  next();
});

feeRecordSchema.index({ student: 1, academicSession: 1 });
feeRecordSchema.index({ student: 1, feeType: 1, academicSession: 1 });

const FeeRecord = mongoose.model('FeeRecord', feeRecordSchema);
module.exports = FeeRecord;
