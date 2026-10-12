import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

const argValue = (name) => {
  const index = process.argv.indexOf(name);

  return index === -1 ? undefined : process.argv[index + 1];
};

const scenarioArg = () => {
  const scenario = argValue('--scenario');

  if (scenario !== undefined && !(scenario in SCENARIOS)) throw new Error(`알 수 없는 시나리오: ${scenario}`);

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

const seedIos = (values, removedKeys) => {
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

  const seeded = { ...stored, ...values };
  for (const key of removedKeys) delete seeded[key];

  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(seeded));

  return deviceId;
};

const adb = (args, options = {}) => {
  try {
    return execFileSync('adb', args, { stdio: ['pipe', 'pipe', 'pipe'], ...options });
  } catch (error) {
    throw new Error(`adb ${args.join(' ')} 실패: ${String(error.stderr).trim()}`);
  }
};

// `maestro -p android`가 기기를 지정하지 않으므로 adb 기기가 하나일 때만 진행
const onlyAndroidDevice = () => {
  const devices = adb(['devices'], { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line.endsWith('\tdevice'))
    .map((line) => line.split('\t')[0]);

  if (devices.length !== 1) throw new Error(`adb 기기가 ${devices.length}개. 에뮬레이터 하나만 연결한다`);

  return devices[0];
};

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

// `run-as`가 디버그 빌드에서만 동작해서 `pnpm android`로 설치한 빌드 필요
const seedAndroid = (values, removedKeys) => {
  const serial = onlyAndroidDevice();
  // `exec-in`/`exec-out`은 `run-as` 실패에도 종료 코드 0을 반환하므로 `shell`로 먼저 확인
  adb(['-s', serial, 'shell', `run-as ${BUNDLE_IDENTIFIER} true`]);

  // 앱이 실행 중이면 AsyncStorage가 종료 시점에 메모리 값으로 파일을 덮어씀
  adb(['-s', serial, 'shell', 'am', 'force-stop', BUNDLE_IDENTIFIER]);

  const workDirectory = mkdtempSync(join(tmpdir(), 'tadak-e2e-'));
  const databasePath = join(workDirectory, 'RKStorage');

  try {
    // `exec-out`은 파일이 없어도 오류 메시지를 stdout으로 출력하고 종료 코드 0을 반환하므로 `ls`로 확인한 파일만 복사
    const existing = adb(['-s', serial, 'shell', `run-as ${BUNDLE_IDENTIFIER} ls databases 2>/dev/null || true`], { encoding: 'utf8' }).split(/\s+/);
    // 트랜잭션 중 강제 종료 시 `-journal`에 롤백 기록이 남으므로 함께 복사. `sqlite3`가 DB를 열 때 롤백
    for (const name of ['RKStorage', 'RKStorage-journal'].filter((file) => existing.includes(file))) {
      writeFileSync(join(workDirectory, name), adb(['-s', serial, 'exec-out', `run-as ${BUNDLE_IDENTIFIER} cat databases/${name}`]));
    }

    const statements = [
      // `ReactDatabaseSupplier`와 같은 스키마. `user_version`이 0이면 앱의 `onCreate`가 `CREATE TABLE`을 재실행해 실패
      'CREATE TABLE IF NOT EXISTS catalystLocalStorage (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
      'PRAGMA user_version = 1;',
      ...Object.entries(values).map(([key, value]) => `INSERT OR REPLACE INTO catalystLocalStorage VALUES (${sqlString(key)}, ${sqlString(value)});`),
      ...removedKeys.map((key) => `DELETE FROM catalystLocalStorage WHERE key = ${sqlString(key)};`),
    ];
    execFileSync('sqlite3', [databasePath], { input: statements.join('\n') });

    adb(['-s', serial, 'exec-in', `run-as ${BUNDLE_IDENTIFIER} sh -c 'mkdir -p databases && cat > databases/RKStorage'`], { input: readFileSync(databasePath) });
    // 기기에 남은 `-journal`이 새 DB에 롤백으로 적용되므로 삭제
    adb(['-s', serial, 'shell', `run-as ${BUNDLE_IDENTIFIER} rm -f databases/RKStorage-journal`]);
  } finally {
    rmSync(workDirectory, { recursive: true, force: true });
  }

  return serial;
};

const main = () => {
  const scenario = scenarioArg();
  const values = scenario === undefined ? { ...E2E_MINUTES, ...E2E_DISMISSED_NOTICES } : { ...E2E_MINUTES, ...SCENARIOS[scenario]() };
  // 이전 실행이 남긴 툴팁 닫기 기록이 시나리오 전제를 깨서 삭제
  const removedKeys = scenario === undefined ? [] : ['ambientSoundTooltipDismissed'];
  const deviceId = argValue('--platform') === 'android' ? seedAndroid(values, removedKeys) : seedIos(values, removedKeys);

  console.log(`${deviceId}: 집중 ${E2E_MINUTES['timer.minutes.focus']}분, 휴식 ${E2E_MINUTES['timer.minutes.rest']}분${scenario === undefined ? '' : `, 시나리오 ${scenario}`}`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
