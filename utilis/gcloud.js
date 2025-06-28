const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Assumes GOOGLE_APPLICATION_CREDENTIALS env var is set or key is loaded via code
const storage = new Storage();
const bucketName = 'Bills'; // change to your actual GCS bucket

exports.uploadBufferToGCS = async (buffer, filename, folder) => {
  const gcsFileName = `${folder}/${Date.now()}-${filename}`;
  const file = storage.bucket(bucketName).file(gcsFileName);

  await file.save(buffer, {
    resumable: false,
    contentType: 'application/pdf',
    public: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  return `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
};
