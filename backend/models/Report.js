const mongoose = require('mongoose');
const ReportSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required:false},
  originalFilename: String,
  rowsSampled: Number,
  coverage: Object,
  scores: Object,
  findings: Array,
  createdAt: {type: Date, default: Date.now}
});
module.exports = mongoose.model('Report', ReportSchema);
