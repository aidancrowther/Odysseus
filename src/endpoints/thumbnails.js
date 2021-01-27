const fs = require('fs');
const promisify = require('util').promisify;
const unlink = promisify(fs.unlink);
const multer = require('multer');
const storage = require('../storage');
const getThumbnails = require('../thumbnails').getThumbnails;

/** Upload middleware from milter */
const upload = multer({ storage }).array('image', 1);

/**
 *
 */
exports.get = async function (req, res) {
  res.send(await getThumbnails());
};

/**
 *
 */
exports.post = async function (req, res) {
  upload(req, res, (err) => {
    if (err) return res.sendStatus(500);
    return res.sendStatus(204);
  });
};

/**
 * TODO Add docs
 */
exports.del = async function (req, res) {
  const toRemove = req.body.toRemove;
  for (const image in toRemove) { await unlink('./interface/images/' + toRemove[image]); }
  res.send('Files removed successfully');
};
