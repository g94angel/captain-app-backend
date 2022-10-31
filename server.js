const express = require('express');
const app = express();
const mongoose = require('mongoose');
// const uuidv4 = require('uuid/v4');
// const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const controller = require('./controllers/claimController');
// const imageController = require('./controllers/imageController');
// const imageRoutes = require('./routes/image');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.split('/')[0] === 'image') {
    cb(null, true);
  } else {
    cb(new Error('File is not of the correct type'), false);
  }
};
const upload = multer({ storage, fileFilter }).single('file');

const multipleUploads = multer({ storage, fileFilter }).array('files', 10);

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

const randomImageName = (bytes = 8) =>
  crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

// middleware & static files
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// app.use('/api/image', imageRoutes);

// using this to store images

// app.get('/upload', controller.getImage, async (req, res) => {
//   const imageName = res.locals.image;
//   const getObjectParams = {
//     Bucket: bucketName,
//     Key: imageName,
//   };
//   const command = new GetObjectCommand(getObjectParams);
//   const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
// });

app.post('/upload', upload, async (req, res) => {
  // console.log('req.body', req.body); // other data
  // console.log('req.file', req.file); // file upload data

  // resize and beautify image we want to send to S3
  // const buffer = await sharp(req.file.buffer);
  // .resize({ height: 1920, width: 1080, fit: 'contain' })
  // .toBuffer();

  const imageName = randomImageName();
  console.log(req.file);
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);

  await s3.send(command);
  res.send(imageName);
});

app.post('/uploads', multipleUploads, async (req, res) => {
  // console.log('req.body', req.body); // other data
  // console.log('req.file', req.file); // file upload data

  // resize and beautify image we want to send to S3
  // const buffer = await sharp(req.file.buffer);
  // .resize({ height: 1920, width: 1080, fit: 'contain' })
  // .toBuffer();

  console.log('inside multiple uploads on server');

  // const params = {
  //   Bucket: bucketName,
  //   Key: imageName,
  //   Body: req.file.buffer,
  //   ContentType: req.file.mimetype,
  // };
  let urls = '';
  const params = req.files.map((file) => {
    const randNum = randomImageName();
    urls += `${randNum},`;
    return {
      Bucket: bucketName,
      Key: randNum,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
  });
  // console.log('this is params', params);
  const results = await Promise.all(
    params.map(async (param) => await s3.send(new PutObjectCommand(param)))
  );
  // console.log('these are the results', results);
  // const command = new PutObjectCommand(params);

  // // await s3.send(command);
  res.send({
    data: req.files,
    msg: 'Successfully uploaded ' + req.files.length + ' files!',
    urls: urls,
  });
});

// const Image = require('./models/image');

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

// set up multer for storing uploaded files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads');
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

// // const upload = multer({ dest: 'uploads/' });
// const upload = multer({ storage: storage });

// routes

// app.get('/', (req, res) => {
//   res.send('Welcome to my app');
// });

// app.post(
//   '/newclaim',
//   upload.single('info'),
//   (req, res) => {
//     // upload(req, res, (err) => {
//     //   console.log(req.body);
//     //   if (err) console.log(err);
//     //   else {
//     // console.log('this is body', req.body);
//     // console.log('this is file', req.file);
//     console.log(req.file);
//     console.log('on backend)');
//     // const newImage = new Image({
//     //   name: req.body.name,
//     //   image: {
//     //     data: fs.readFileSync('uploads/' + req.file.filename),
//     //     contentType: 'image/png',
//     //   },
//     // });
//     // newImage
//     //   .save()
//     //   .then(() => res.send('successfully uploaded'))
//     //   .catch((err) => console.log(err));
//   }
//   // });
// );

// app.get('/getimages', imageController.getImages, (req, res) => {
//   res.status(200).json(res.locals.images);
// });

// app.post('/upload', upload.single('file'), (req, res, next) => {
//   // console.log('the body', req.body);
//   // const id = req.body.id;
//   const image = {
//     id: req.body.id,
//     image: {
//       data: fs.readFileSync(
//         path.join(__dirname + '/uploads/' + req.file.filename)
//       ),
//       contentType: 'image/png',
//     },
//   };
//   console.log('image', image);
//   console.log('going to uploadImage');
//   Image.create(image)
//     .then((image) => {
//       console.log('saved image');
//       res.status(200).json(image);
//     })
//     .catch((err) => {
//       return next({
//         log: `imageController.uploadImage: ERROR: ${err}`,
//         message: {
//           err: 'Error occured in imageController.uploadImage. Check server logs for more details.',
//         },
//       });
//     });
// });

app.get('/getclaims', controller.getClaims, async (req, res) => {
  // console.log(res.locals.claims);
  // const claims = res.locals.claims;
  // need this for multiple claim
  for (const claim of res.locals.claims) {
    if (!claim.imageName) {
      // console.log('no image');
      continue;
    }
    // if there are multiple
    else if (claim.imageName.includes(',')) {
      let returnedURLs = '';
      const newArray = claim.imageName.split(',');
      for (let i = 0; i < newArray.length; i++) {
        // console.log(i);
        // console.log(newArray[i]);

        // console.log('imageName', imageName);
        // console.log(i);
        // console.log(newArray[i]);
        const getObjectParams = {
          Bucket: bucketName,
          Key: newArray[i],
        };
        // console.log('params', getObjectParams);
        const command = new GetObjectCommand(getObjectParams);
        // console.log('command', command);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        // console.log('url', i, url);
        // console.log('from multiple', url);
        returnedURLs += `${url},`;
        // console.log('returned URLs', returnedURLs);
      }
      claim.url = returnedURLs;
      // console.log('this is the claim', claim);
      // console.log('returned URLs', returnedURLs);
      // console.log('returned URLS', claim.url);
    }
    // need this
    else if (claim.imageName) {
      // console.log('one pic here');
      // console.log(claim);
      const getObjectParams = {
        Bucket: bucketName,
        Key: claim.imageName,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      // console.log(url);
      claim.url = url;
      // console.log(claim);
    }
  }
  // console.log(res.locals.claims);
  res.status(200).json(res.locals.claims);
});

app.post('/newclaim', controller.newClaim, (req, res) => {
  res.status(200).json(res.locals.newClaim);
});

app.put('/updateclaim', controller.updateClaim, (req, res) => {
  res.status(200).json(res.locals.updatedClaim);
});

app.delete('/deleteclaim/:id', controller.deleteClaim, async (req, res) => {
  // if the deleted claim has an image this code also deletes the image from S3

  const { deletedClaim } = res.locals;
  console.log('inside server deleted claim', deletedClaim);
  if (deletedClaim.imageName) {
    const { imageName } = deletedClaim;
    const params = {
      Bucket: bucketName,
      Key: imageName,
    };
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  }
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
