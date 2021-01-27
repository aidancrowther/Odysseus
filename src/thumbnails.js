const fs = require('fs');
const promisify = require('util').promisify;
const readdir = promisify(fs.readdir);
const path = require('path');

/**
 * TODO document functionality
 */
exports.getThumbnails = async function () {
  const thumbnails = {};
  const images = await readdir(path.join(global.static, 'images'));
  for (const image in images) {
    let toSplit = images[image];
    if (images[image].includes('-')) toSplit = toSplit.split('-')[1];
    const current = toSplit.split('.')[0];
    if (thumbnails[current]) thumbnails[current].push(images[image]);
    else thumbnails[current] = [images[image]];
  }
  return thumbnails;
};
