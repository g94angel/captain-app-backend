const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const controller = require('./controllers/claimController');

const corsOptions = {
  origin: '*',
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Use this after the variable declaration

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
// app.use(cors());

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

// ROUTES TO HANDLE IMAGE UPLOADS
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

  await Promise.all(
    params.map(async (param) => await s3.send(new PutObjectCommand(param)))
  );

  res.send({
    data: req.files,
    msg: 'Successfully uploaded ' + req.files.length + ' files!',
    urls: urls,
  });
});

app.get('/getclaims', controller.getClaims, async (req, res) => {
  for (const claim of res.locals.claims) {
    // if no image, then continue to next claim
    if (!claim.imageName) {
      // console.log('no image');
      continue;
    }
    // if there are multiple
    else if (claim.imageName.includes(',')) {
      let returnedURLs = '';
      const newArray = claim.imageName.split(',');
      for (let i = 0; i < newArray.length; i++) {
        const getObjectParams = {
          Bucket: bucketName,
          Key: newArray[i],
        };
        const command = new GetObjectCommand(getObjectParams);

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        returnedURLs += `${url},`;
      }
      claim.url = returnedURLs;
    }
    // if there is one
    else if (claim.imageName) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: claim.imageName,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      claim.url = url;
    }
  }

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
