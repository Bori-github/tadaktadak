import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BUNDLE_IDENTIFIER = 'com.boriguri.tadaktadak';

/** 플로우가 전제하는 타이머 시간(분). `.maestro/*.yaml` 첫 주석 */
const E2E_MINUTES = { 'timer.minutes.focus': '1', 'timer.minutes.rest': '1' };

// 실행 중이 아닌 앱을 종료하면 `simctl`이 stderr에 오류를 출력하므로, 표준 오류를 예외에만 담음
const simctl = (...args) => {
  try {
    return execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    throw new Error(`simctl ${args[0]} 실패: ${String(error.stderr).trim()}`);
  }
};

const bootedDeviceId = () => {
  const booted = Object.values(JSON.parse(simctl('list', 'devices', 'booted', '-j')).devices).flat();

  if (booted.length === 0) throw new Error('부팅된 시뮬레이터 없음. 시뮬레이터를 먼저 실행한다');

  return booted[0].udid;
};

const main = () => {
  const deviceId = process.env.E2E_DEVICE_ID ?? bootedDeviceId();

  // 앱이 실행 중이면 AsyncStorage가 종료 시점에 메모리 값으로 파일을 덮어씀
  try {
    simctl('terminate', deviceId, BUNDLE_IDENTIFIER);
  } catch {
    // 앱이 실행 중이 아니면 종료가 실패하지만, 이후 동작에 영향 없음
  }

  const container = simctl('get_app_container', deviceId, BUNDLE_IDENTIFIER, 'data');
  const manifestPath = join(container, 'Library/Application Support', BUNDLE_IDENTIFIER, 'RCTAsyncLocalStorage_V1/manifest.json');

  let stored = {};
  try {
    stored = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    // 앱을 한 번도 실행하지 않았으면 파일 없음. 새로 생성하면 첫 실행에서 읽음
  }

  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ ...stored, ...E2E_MINUTES }));

  console.log(`${deviceId}: 집중 ${E2E_MINUTES['timer.minutes.focus']}분, 휴식 ${E2E_MINUTES['timer.minutes.rest']}분`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
