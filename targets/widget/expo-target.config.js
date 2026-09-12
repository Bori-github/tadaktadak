/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  icon: '../../assets/icon.png',
  deploymentTarget: '18.0',
  images: {
    'button-round-enabled': {
      '2x': './images/button-round-enabled@2x.png',
      '3x': './images/button-round-enabled@3x.png',
    },
    'icon-stop': { '2x': './images/icon-stop@2x.png', '3x': './images/icon-stop@3x.png' },
    'bonfire-hot-still-9': { '2x': './images/bonfire-hot-still-9@2x.png', '3x': './images/bonfire-hot-still-9@3x.png' },
    'bonfire-cold-9': { '2x': './images/bonfire-cold-9@2x.png', '3x': './images/bonfire-cold-9@3x.png' },
  },
};
