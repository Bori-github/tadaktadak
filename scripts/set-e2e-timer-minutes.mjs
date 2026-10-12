import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BUNDLE_IDENTIFIER = 'com.boriguri.tadaktadak';

/** 플로우가 전제하는 타이머 시간(분). `.maestro/*.yaml` 첫 주석 */
const E2E_MINUTES = { 'timer.minutes.focus': '1', 'timer.minutes.rest': '1' };

/** 배경음 안내 툴팁의 `DismissLayer`가 첫 탭을 소비하지 않도록 닫힘 상태로 저장. 키는 `AMBIENT_SOUND_TOOLTIP_DISMISSED_KEY` */
const E2E_DISMISSED_NOTICES = { ambientSoundTooltipDismissed: 'true' };

/** `--scenario` 인자 값. 같은 이름의 `.maestro/` 하위 폴더 플로우가 전제하는 저장값 */
const SCENARIOS = {
  // 집중 타이머 진행 세션만 저장하고 툴팁 닫기 기록은 없음. 진행 중 툴팁 미표시 검사용
  'running-without-dismiss': () => {
    const startedAt = Date.now();

    return { 'timer.session': JSON.stringify({ phase: 'running', mode: 'focus', startedAt, endsAt: startedAt + 60 * 1000 }) };
  },
};

const scenarioArg = () => {
  const index = process.argv.indexOf('--scenario');

  if (index === -1) return undefined;

  const scenario = process.argv[index + 1];

  if (!(scenario in SCENARIOS)) throw new Error(`알 수 없는 시나리오: ${scenario}`);

  return scenario;
};

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
  const scenario = scenarioArg();
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
  const seeded = scenario === undefined ? { ...stored, ...E2E_MINUTES, ...E2E_DISMISSED_NOTICES } : { ...stored, ...E2E_MINUTES, ...SCENARIOS[scenario]() };
  // 이전 실행이 남긴 툴팁 닫기 기록이 시나리오 전제를 깨서 삭제
  if (scenario !== undefined) delete seeded.ambientSoundTooltipDismissed;
  writeFileSync(manifestPath, JSON.stringify(seeded));

  console.log(`${deviceId}: 집중 ${E2E_MINUTES['timer.minutes.focus']}분, 휴식 ${E2E_MINUTES['timer.minutes.rest']}분${scenario === undefined ? '' : `, 시나리오 ${scenario}`}`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
