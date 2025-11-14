const { Dropbox } = require('dropbox');
const fs = require('fs').promises;

const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN
});

/**
 * Upload file to Dropbox
 * @param {string} filePath - Local path to file
 * @param {string} folder - Dropbox folder name
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Upload result with shared link
 */
const uploadFile = async (filePath, folder = '/learnmate/lessons', filename) => {
  try {
    const fileContent = await fs.readFile(filePath);
    
    const timestamp = Date.now();
    const dropboxPath = `${folder}/${timestamp}-${filename}`;
    
    const uploadResponse = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileContent,
      mode: 'add',
      autorename: true
    });
    
    const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: uploadResponse.result.path_lower,
      settings: {
        requested_visibility: 'public',
        audience: 'public',
        access: 'viewer'
      }
    });
    
    const downloadUrl = sharedLinkResponse.result.url.replace('?dl=0', '?dl=1');
    
    return {
      url: downloadUrl,
      path: uploadResponse.result.path_lower,
      id: uploadResponse.result.id,
      name: uploadResponse.result.name,
      size: uploadResponse.result.size
    };
  } catch (error) {
    throw new Error(`Dropbox upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Dropbox
 * @param {string} path - Dropbox file path
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (path) => {
  try {
    const result = await dbx.filesDeleteV2({
      path: path
    });
    return result;
  } catch (error) {
    throw new Error(`Dropbox deletion failed: ${error.message}`);
  }
};

/**
 * Get download URL for a file
 * @param {string} path - Dropbox file path
 * @returns {Promise<string>} Temporary download URL
 */
const getDownloadUrl = async (path) => {
  try {
    const response = await dbx.filesGetTemporaryLink({
      path: path
    });
    return response.result.link;
  } catch (error) {
    throw new Error(`Failed to get download URL: ${error.message}`);
  }
};

module.exports = {
  dbx,
  uploadFile,
  deleteFile,
  getDownloadUrl
};
