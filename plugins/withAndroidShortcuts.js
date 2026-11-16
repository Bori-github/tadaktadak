const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

// `modules/live-activity`의 `EXTRA_START_REQUESTED`와 같은 값
const EXTRA_START_REQUESTED = 'expo.modules.liveactivity.START_REQUESTED';

const shortcutsXml = (packageName) => `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="start-focus-timer"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/shortcut_start_focus"
    android:shortcutLongLabel="@string/shortcut_start_focus">
    <!-- Android 13+는 intent filter와 일치하지 않는 Intent를 차단하므로 런처와 같은 MAIN/LAUNCHER 사용 -->
    <intent
      android:action="android.intent.action.MAIN"
      android:targetPackage="${packageName}"
      android:targetClass="${packageName}.MainActivity">
      <categories android:name="android.intent.category.LAUNCHER" />
      <extra android:name="${EXTRA_START_REQUESTED}" android:value="true" />
    </intent>
  </shortcut>
</shortcuts>
`;

// 앱 아이콘 메뉴의 「타닥타닥 시작」 단축어. 정적 단축어라 앱 실행 전에도 표시됨
module.exports = function withAndroidShortcuts(config) {
  config = withAndroidManifest(config, (config) => {
    // Activity의 `meta-data` 배열도 application과 같은 형태라 application용 helper 사용
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults),
      'android.app.shortcuts',
      '@xml/shortcuts',
      'resource',
    );

    return config;
  });

  return withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDirectory = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');

      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(path.join(xmlDirectory, 'shortcuts.xml'), shortcutsXml(config.android.package));

      return config;
    },
  ]);
};
