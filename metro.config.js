const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 루트의 참고 레포는 번들 대상이 아니다
const referencesDir = path.join(__dirname, 'references');
config.resolver.blockList = [new RegExp(`^${referencesDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*`)];

module.exports = config;
