const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
    },
    number: {
      type: String,
    },
    address: {
      type: String,
    },
    useAddress: {
      type: Boolean,
    },
    exterior: {
      type: Boolean,
    },
    interior: {
      type: Boolean,
    },
    water: {
      type: Boolean,
    },
    fire: {
      type: Boolean,
    },
    wind: {
      type: Boolean,
    },
    hail: {
      type: Boolean,
    },
    description: {
      type: String,
    },
    imageName: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  { timestamps: true }
);

// takes in the name of the model, and the schema
const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
