const multer = require('multer');
const path = require('path');

exports.storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, path.join(global.static, 'images'));
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
