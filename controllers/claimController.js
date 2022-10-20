const Claim = require('../models/claim');

const getClaims = (req, res, next) => {
  Claim.find()
    // .sort({ createdAt: -1 }) // sorts by created date, newest to oldest
    .then((claims) => {
      // console.log('these are the results', claims);
      res.locals.claims = claims;
      return next();
    })
    .catch((err) => {
      return next({
        log: `controller.getClaims: ERROR: ${err}`,
        message: {
          err: 'Error occured in controller.getClaims. Check server logs for more details.',
        },
      });
    });
};

const newClaim = (req, res, next) => {
  console.log('inside newClaim');
  const claimInfo = req.body;
  console.log(claimInfo);
  Claim.create(claimInfo)
    .then((newClaim) => {
      res.locals.newClaim = newClaim;
      return next();
    })
    .catch((err) => {
      return next({
        log: `controller.newClaim: ERROR: ${err}`,
        message: {
          err: 'Error occured in controller.newClaim. Check server logs for more details.',
        },
      });
    });
};

const updateClaim = (req, res, next) => {
  const { id, info } = req.body;
  Claim.findOneAndUpdate({ _id: id }, info, { new: true })
    .then((updatedClaim) => {
      res.locals.updatedClaim = updatedClaim;
      return next();
    })
    .catch((err) => {
      return next({
        log: `controller.updateClaim: ERROR: ${err}`,
        message: {
          err: 'Error occured in controller.updateClaim. Check server logs for more details.',
        },
      });
    });
};

const deleteClaim = (req, res, next) => {
  const { id } = req.params;
  Claim.findByIdAndDelete(id)
    .then((deletedClaim) => {
      console.log('deleted claim', deletedClaim);
      res.locals.deletedClaim = deletedClaim;
      return next();
    })
    .catch((err) => {
      return next({
        log: `controller.deleteClaim: ERROR: ${err}`,
        message: {
          err: 'Error occured in controller.deleteClaim. Check server logs for more details.',
        },
      });
    });
};

module.exports = {
  getClaims,
  newClaim,
  deleteClaim,
  updateClaim,
};
