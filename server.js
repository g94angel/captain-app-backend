const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const mongoose = require('mongoose');
const controller = require('./controllers/claimController');

// connect to mongoDB via dbURI string
mongoose
  .connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((result) =>
    // only after mongoDB connects do we want our server to listen. otherwise it wouldn't serve anything.
    app.listen(5000, () => {
      console.log('Connected and listening on port 5000.');
    })
  )
  .catch((err) => console.log(err));

// middleware & static files
app.use(express.static(path.join(__dirname + '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// routes

// app.get('/', (req, res) => {
//   res.send('Welcome to my app');
// });

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
