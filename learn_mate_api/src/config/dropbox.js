const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const fs = require('fs').promises;

let currentAccessToken = null;
let tokenExpiresAt = null;

/**
 * Refresh the Dropbox access token using refresh token
 * @returns {Promise<string>} New access token
 */
const refreshAccessToken = async () => {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!refreshToken || !appKey || !appSecret) {
    throw new Error('Dropbox OAuth credentials not configured. Set DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, and DROPBOX_APP_SECRET');
  }

  const response = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  currentAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 14400) - 300) * 1000;

  return currentAccessToken;
};

/**
 * Get a valid Dropbox access token (refresh if needed)
 * @returns {Promise<string>} Valid access token
 */
const getValidAccessToken = async () => {
  if (!currentAccessToken || (tokenExpiresAt && Date.now() >= tokenExpiresAt)) {
    await refreshAccessToken();
  }
  return currentAccessToken;
};

/**
 * Create a Dropbox instance with current access token
 * @returns {Promise<Dropbox>} Dropbox client instance
 */
const getDropboxClient = async () => {
  const token = await getValidAccessToken();
  return new Dropbox({ accessToken: token });
};

/**
 * Upload file to Dropbox
 * @param {string} filePath - Local path to file
 * @param {string} folder - Dropbox folder name
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Upload result with shared link
 */
const uploadFile = async (filePath, folder = '/learnmate/lessons', filename) => {
  const dbx = await getDropboxClient();
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
};

/**
 * Delete file from Dropbox
 * @param {string} path - Dropbox file path
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (path) => {
  const dbx = await getDropboxClient();
  const result = await dbx.filesDeleteV2({ path });
  return result;
};

/**
 * Get download URL for a file
 * @param {string} path - Dropbox file path
 * @returns {Promise<string>} Temporary download URL
 */
const getDownloadUrl = async (path) => {
  const dbx = await getDropboxClient();
  const response = await dbx.filesGetTemporaryLink({ path });
  return response.result.link;
};

module.exports = {
  uploadFile,
  deleteFile,
  getDownloadUrl,
  refreshAccessToken,
  getValidAccessToken
};
