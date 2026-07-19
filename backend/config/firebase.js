const admin = require('firebase-admin');

let bucket = null;

function initFirebase() {
  if (admin.apps.length) {
    return admin.storage().bucket();
  }

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  bucket = admin.storage().bucket();
  return bucket;
}

module.exports = { initFirebase };
