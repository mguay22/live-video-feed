"use strict";

var _path2 = _interopRequireDefault(require("path"));

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

require("babel-polyfill");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var AWS = require('aws-sdk');

var fs = require('fs');

var fileType = require('file-type');

var bluebird = require('bluebird');

var multiparty = require('multiparty');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
AWS.config.setPromisesDependency(bluebird);
var s3 = new AWS.S3();
var app = (0, _express["default"])();
var PORT = process.env.PORT || 4001;
app.use(_express["default"]["static"](_path2["default"].join(__dirname, 'build')));

var uploadFile = function uploadFile(buffer, name, type) {
  var params = {
    ACL: 'public-read',
    Body: buffer,
    Bucket: process.env.S3_BUCKET,
    ContentType: type.mime,
    Key: "".concat(name, ".").concat(type.ext)
  };
  return s3.upload(params).promise();
};

app.post('/upload-video', function (req, res) {
  var form = new multiparty.Form();
  form.parse(req, function _callee(error, fields, files) {
    var _path, buffer, type, timestamp, fileName, data;

    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!error) {
              _context.next = 2;
              break;
            }

            throw new Error(error);

          case 2:
            _context.prev = 2;
            _path = files.file[0].path;
            buffer = fs.readFileSync(_path);
            type = fileType(buffer);
            timestamp = Date.now().toString();
            fileName = "videos/".concat(timestamp, "-lg");
            _context.next = 10;
            return regeneratorRuntime.awrap(uploadFile(buffer, fileName, type));

          case 10:
            data = _context.sent;
            return _context.abrupt("return", res.status(200).send(data));

          case 14:
            _context.prev = 14;
            _context.t0 = _context["catch"](2);
            console.log(_context.t0);
            return _context.abrupt("return", res.status(400).send(_context.t0));

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[2, 14]]);
  });
});
app.get('/video', function (req, res) {
  var params = {
    Bucket: process.env.S3_BUCKET,
    Prefix: 'videos/'
  };
  s3.listObjects(params, function (err, data) {
    console.log(data.Contents.length);
    res.json(data.Contents[data.Contents.length - 1].Key);
  });
});
app.listen(PORT, function () {
  console.log("Server listening at port ".concat(PORT, "."));
});
