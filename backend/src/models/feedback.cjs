const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
    },
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true },
    message: { type: String, required: true, minlength: 5 },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    category: {
      type: String,
      enum: ['bug', 'suggestion', 'compliment', 'question', 'other'],
      default: 'other',
    },
    aiSentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    aiConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
