const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  id: String,
  // name: String,
  // desc: String,
  image: {
    data: Buffer, // binary data
    contentType: String,
  },
});

//Image is a model which has a schema imageSchema

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
