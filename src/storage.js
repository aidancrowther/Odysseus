const multer = require('multer');

exports.storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './interface/images/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
