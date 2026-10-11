const mongoose = require('mongoose');

const managementReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    period: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: 'general',
    },

    status: {
      type: String,
      default: 'Ready to review',
    },

    fileSize: {
      type: String,
      default: '1.4 MB',
    },

    audited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'ManagementReport',
  managementReportSchema
);