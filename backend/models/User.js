const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    registerNumber: {
      type: String,
      trim: true,
      default: '',
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    backlogs: {
      type: Number,
      min: 0,
      default: 0,
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    hostelDetails: {
      block: { type: String, default: '' },
      roomNumber: { type: String, default: '' },
      messType: { type: String, default: 'none' },
      wardenName: { type: String, default: '' },
      wardenPhone: { type: String, default: '' },
    },
    feeDetails: [
      {
        feeType: { type: String, required: true },
        amount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        dueDate: { type: Date, default: null },
        status: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], default: 'Unpaid' },
      }
    ],
    achievements: [
      {
        title: { type: String, required: true },
        date: { type: Date, default: null },
        description: { type: String, default: '' },
      }
    ],
    certificates: [
      {
        title: { type: String, required: true },
        issuingOrg: { type: String, default: '' },
        date: { type: Date, default: null },
        credentialUrl: { type: String, default: '' },
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre('validate', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
    if (!this.email.endsWith('@srmist.edu.in')) {
      if (this.isNew) {
        return next(new Error('Only official SRM Institute email addresses (@srmist.edu.in) are allowed.'));
      } else {
        this.flaggedForReview = true;
      }
    }
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    semester: this.semester,
    registerNumber: this.registerNumber,
    cgpa: this.cgpa,
    backlogs: this.backlogs,
    graduationYear: this.graduationYear,
    resumeUrl: this.resumeUrl,
    avatarUrl: this.avatarUrl,
    hostelDetails: this.hostelDetails,
    feeDetails: this.feeDetails,
    achievements: this.achievements,
    certificates: this.certificates,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
