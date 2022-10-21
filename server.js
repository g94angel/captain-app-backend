const express = require('express');
const app = express();
const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const controller = require('./controllers/claimController');
const imageController = require('./controllers/imageController');

const multer = require('multer');
const Image = require('./models/image');

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

const PORT = process.env.PORT || 5000;

// connect to mongoDB via dbURI string
mongoose
  .connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((result) =>
    // only after mongoDB connects do we want our server to listen. otherwise it wouldn't serve anything.
    app.listen(PORT, () => {
      console.log('Connected and listening on port 5000.');
    })
  )
  .catch((err) => console.log(err));

// middleware & static files
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// routes

// app.get('/', (req, res) => {
//   res.send('Welcome to my app');
// });

app.get('/getimages', imageController.getImages, (req, res) => {
  res.status(200).json(res.locals.images);
});

app.post('/upload', upload.single('file'), (req, res, next) => {
  const image = {
    img: {
      data: fs.readFileSync(
        path.join(__dirname + '/uploads/' + req.file.filename)
      ),
      contentType: 'image/png',
    },
  };
  console.log('image', image);
  console.log('going to uploadImage');
  Image.create(image)
    .then((image) => {
      console.log('saved image');
      res.status(200).json(image);
    })
    .catch((err) => {
      return next({
        log: `imageController.uploadImage: ERROR: ${err}`,
        message: {
          err: 'Error occured in imageController.uploadImage. Check server logs for more details.',
        },
      });
    });
});

app.get('/getclaims', controller.getClaims, (req, res) => {
  res.status(200).json(res.locals.claims);
});

app.post('/newclaim', controller.newClaim, (req, res) => {
  res.status(200).json(res.locals.newClaim);
});

app.put('/updateclaim', controller.updateClaim, (req, res) => {
  res.status(200).json(res.locals.updatedClaim);
});

app.delete('/deleteclaim/:id', controller.deleteClaim, (req, res) => {
  res.status(200).json(res.locals.deletedClaim);
});

// Unknown route handler
app.use((req, res) => res.sendStatus(404));

// Global error handler
app.use((err, req, res, next) => {
  const defaultErr = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: { err: 'An error occurred' },
  };
  const errorObj = Object.assign({}, defaultErr, err);
  console.log(errorObj.log);
  return res.status(errorObj.status).json(errorObj.message);
});
