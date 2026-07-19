const { v4: uuidv4 } = require('uuid');
const { initFirebase } = require('../config/firebase');
const AppError = require('../utils/AppError');

/**
 * Uploads a buffer to Firebase Storage under the given folder and returns
 * a publicly accessible download URL plus the storage path (for later deletion).
 *
 * Firebase Storage buckets created after late 2020 default to "Uniform Bucket-Level
 * Access", which rejects per-object ACL calls like makePublic(). Rather than requiring
 * every deployer to manually disable that setting, we try makePublic() first (works on
 * older/fine-grained buckets) and transparently fall back to a signed URL otherwise.
 */
async function uploadFileToFirebase(file, folder) {
  try {
    const bucket = initFirebase();
    const ext = file.originalname.split('.').pop();
    const storagePath = `${folder}/${uuidv4()}.${ext}`;
    const blob = bucket.file(storagePath);

    await new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        metadata: { contentType: file.mimetype },
        resumable: false,
      });
      blobStream.on('error', reject);
      blobStream.on('finish', resolve);
      blobStream.end(file.buffer);
    });

    let fileUrl;
    try {
      await blob.makePublic();
      fileUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    } catch (aclError) {
      // Uniform Bucket-Level Access blocks makePublic() — fall back to a signed URL.
      // Far-future expiry since these links are meant to work like permanent public URLs.
      console.warn(
        '[Firebase Upload] makePublic() failed (likely Uniform Bucket-Level Access is enabled). ' +
          'Falling back to a signed URL. See DEPLOYMENT.md for how to avoid this.'
      );
      const [signedUrl] = await blob.getSignedUrl({ action: 'read', expires: '01-01-2100' });
      fileUrl = signedUrl;
    }

    return { fileUrl, storagePath };
  } catch (error) {
    console.error('[Firebase Upload Error]', error);
    throw new AppError('File upload failed. Please try again.', 502);
  }
}

async function deleteFileFromFirebase(storagePath) {
  if (!storagePath) return;
  try {
    const bucket = initFirebase();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    // Log but don't block the DB deletion on a storage cleanup failure
    console.error('[Firebase Delete Error]', error);
  }
}

module.exports = { uploadFileToFirebase, deleteFileFromFirebase };
