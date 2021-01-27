const fs = require('fs');
const promisify = require('util').promisify;
const readdir = promisify(fs.readdir);

/**
 * TODO document functionality
 */
exports.getThumbnails = async function () {
  const thumbnails = {};
  const images = await readdir('./interface/images');
  for (const image in images) {
    let toSplit = images[image];
    if (images[image].includes('-')) toSplit = toSplit.split('-')[1];
    const current = toSplit.split('.')[0];
    if (thumbnails[current]) thumbnails[current].push(images[image]);
    else thumbnails[current] = [images[image]];
  }
  return thumbnails;
};
