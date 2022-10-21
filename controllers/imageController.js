const Image = require('../models/image');
const fs = require('fs');
const path = require('path');

const multer = require('multer');

// set up multer for storing uploaded files
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now());
  },
});

// let upload = multer({ storage: storage });
const upload = multer({ dest: 'uploads/' });

const getImages = (req, res, next) => {
  Image.find()
    .then((images) => {
      // console.log('these are the images', images);
      res.locals.images = images;
      return next();
    })
    .catch((err) => {
      return next({
        log: `imageController.getImages: ERROR: ${err}`,
        message: {
          err: 'Error occured in imageController.getImages. Check server logs for more details.',
        },
      });
    });
};

const uploadImage = (req, res, next) => {
  // console.log('inside image controller');
  // console.log('this is file', req.file.filename);
  // const image = {
  //   img: {
  //     data: fs.readFileSync(
  //       path.join(__dirname + '/uploads/' + req.file.filename)
  //     ),
  //     contentType: 'image/png',
  //   },
  // };
  // console.log('image', image);
  Image.create(image)
    .then((image) => {
      res.locals.image = image;
      return next();
    })
    .catch((err) => {
      return next({
        log: `imageController.uploadImage: ERROR: ${err}`,
        message: {
          err: 'Error occured in imageController.uploadImage. Check server logs for more details.',
        },
      });
    });
};

module.exports = {
  getImages,
  uploadImage,
};
