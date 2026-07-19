const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, required: true },
        startYear: { type: Number },
        endYear: { type: Number },
        grade: { type: String, default: '' },
      },
    ],
    skills: [{ type: String, trim: true }],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: Date },
        endDate: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String, default: '' },
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        technologies: [{ type: String, trim: true }],
        link: { type: String, default: '' },
      },
    ],
    certificates: [
      {
        name: { type: String, required: true },
        issuingOrganization: { type: String, default: '' },
        issueDate: { type: Date },
        credentialUrl: { type: String, default: '' },
      },
    ],
    achievements: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    links: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
