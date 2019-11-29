import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';

const AWS = require('aws-sdk');
const fs = require('fs');
const fileType = require('file-type');
const bluebird = require('bluebird');
const multiparty = require('multiparty');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

AWS.config.setPromisesDependency(bluebird);

const s3 = new AWS.S3();

const app = express()
const PORT = process.env.PORT || 4001;

app.use(express.static(path.join(__dirname, 'build')));

const uploadFile = (buffer, name, type) => {
    const params = {
        ACL: 'public-read',
        Body: buffer,
        Bucket: process.env.S3_BUCKET,
        ContentType: type.mime,
        Key: `${name}.${type.ext}`
    };
    return s3.upload(params).promise();
};

app.post('/upload-video', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, async (error, fields, files) => {
      if (error) throw new Error(error);
      try {
        const path = files.file[0].path;
        const buffer = fs.readFileSync(path);
        const type = fileType(buffer);
        const timestamp = Date.now().toString();
        const fileName = `videos/${timestamp}-lg`;
        const data = await uploadFile(buffer, fileName, type);
        return res.status(200).send(data);
      } catch (error) {
        console.log(error);
        return res.status(400).send(error);
      }
    });
});

app.get('/video', (req, res) => {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Prefix: 'videos/'
        };

        s3.listObjects(params, (err, data) => {
            console.log(data.Contents.length);
            res.json(data.Contents[data.Contents.length - 1].Key);
        });
});

app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}.`);
});

