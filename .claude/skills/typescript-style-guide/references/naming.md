# 네이밍 심화

SKILL.md의 기본 표로 판단이 안 서는 경우를 다룬다.

## 목차

1. [이름 길이 판단 기준](#이름-길이-판단-기준)
2. [함수 동사 선택](#함수-동사-선택)
3. [도메인 타입 이름](#도메인-타입-이름)
4. [제네릭 파라미터](#제네릭-파라미터)
5. [상수와 설정값](#상수와-설정값)
6. [흔한 안티패턴](#흔한-안티패턴)

---

## 이름 길이 판단 기준

**스코프가 좁을수록 짧아도 된다.** 반대로 스코프가 넓으면 길어야 한다.

```ts
// 한 줄 콜백: 짧아도 문맥이 명확
TIMER_MODES.map((m) => TIMER_DEFAULT[m]);

// 함수 전체에서 쓰임: 온전한 이름
const selectedRange = TIMER_RANGE[mode];

// 모듈 export: 파일 밖에서도 읽히므로 가장 서술적으로
export const BUTTON_SIZE_IN_DOTS = 28;
```

3줄 넘게 살아 있는 변수에 `d`, `tmp`, `data2` 같은 이름을 붙이지 않는다. 쓰는 말은 `DESIGN.md`·`SPEC.md`에 고정돼 있다 — 터치한 곳, 선택한 타이머, 타이머 시간(분).

## 함수 동사 선택

| 동사                  | 쓰는 경우                                        |
| --------------------- | ------------------------------------------------ |
| `get`                 | 동기적으로 이미 있는 값을 꺼냄                   |
| `fetch`               | 네트워크 요청                                    |
| `load`                | 비동기이되 네트워크가 아닐 수도 있음(파일, 캐시) |
| `create`              | 새 객체·리소스 생성                              |
| `build`               | 기존 재료로 조립 (부수효과 없음)                 |
| `update` / `patch`    | 전체 교체 / 부분 변경                            |
| `remove` / `delete`   | 컬렉션에서 제외 / 영구 삭제                      |
| `format`              | 표시용 문자열로 변환                             |
| `parse`               | 문자열·raw 데이터를 구조로 변환                  |
| `to`                  | 타입 A를 타입 B로 변환 (`millisecondsToSeconds`) |
| `validate` / `assert` | boolean 반환 / 실패 시 throw                     |
| `handle`              | 이벤트에 반응                                    |

`get`으로 시작하는 함수가 네트워크를 타면 호출부에서 비용을 오해한다. `getUser()`가 API를 호출한다면 `fetchUser()`로 바꾼다. 기기 저장소를 읽는 것은 `load`, 저장 문자열을 구조로 바꾸는 것은 `parse`다 — `parseSession`, `restoreSession`.

## 도메인 타입 이름

도메인 모델은 접미사 없이 쓰고(`TimerSession`, `TimerMode`), 화면에 넘기는 것만 `Props`를 붙인다(`DotButtonProps`).

파생 타입은 원본 이름을 유지하고 의미를 덧붙인다.

```ts
type RunningSession = Extract<TimerSession, { phase: 'running' }>;
type SettingMinutes = Record<TimerMode, number>;
```

## 제네릭 파라미터

- 하나뿐이고 의미가 자명하면 `T`
- 둘 이상이면 `T` 접두 + 역할: `TData`, `TError`, `TVariables`, `TKey`, `TValue`
- 라이브러리 시그니처를 흉내 낼 땐 그 라이브러리 관례를 따른다

`K`, `V`, `E` 같은 한 글자를 여러 개 나열하면 세 번째 파라미터부터 무엇인지 알 수 없다.

```ts
// 나쁨
const mapEntries = <K, V, R>(map: Map<K, V>, fn: (v: V, k: K) => R): R[] => { /* ... */ };

// 좋음
const mapEntries = <TKey, TValue, TResult>(
  map: Map<TKey, TValue>,
  transform: (value: TValue, key: TKey) => TResult,
): TResult[] => { /* ... */ };
```

## 상수와 설정값

- **모듈 레벨 불변 원시값**: UPPER_SNAKE_CASE (`MIN_WIDTH`, `BASE_DIAMETER`)
- **`as const` 객체(룩업 테이블, enum 대용)**: UPPER_SNAKE_CASE 객체명 + PascalCase 키

```ts
export const TIMER_MODES = ['focus', 'rest'] as const;
export type TimerMode = (typeof TIMER_MODES)[number];
```

- **함수 안의 지역 상수**: 그냥 camelCase. `const maxRetry = 3`을 대문자로 쓸 이유는 없다.
- **설정 객체**: camelCase (`settingMinutes`)

값이 계산 결과이거나 참조 타입이면 UPPER_SNAKE_CASE를 쓰지 않는다. 대문자는 "런타임 내내 절대 안 바뀌는 리터럴"이라는 신호로 아껴 쓴다.

## 흔한 안티패턴

| 안티패턴                         | 왜 문제인가                             | 대안                                           |
| -------------------------------- | --------------------------------------- | ---------------------------------------------- |
| `data`, `info`, `item`, `obj`    | 아무 정보도 없음                        | `session`, `remainingMs`                       |
| `sessionData`, `timerInfo`       | `Data`/`Info`는 붙여도 의미가 안 늘어남 | `session`, `timer`                             |
| `modeList`, `modeArray`          | 타입에 이미 있는 정보                   | `modes`                                        |
| `handlePress2`, `newHandlePress` | 숫자·new 접두는 리팩터링 흔적           | 역할로 구분: `handleDialDrag`                  |
| `flag`, `check`                  | 무엇의 참/거짓인지 모름                 | `isRunning`, `hasStoredSession`                |
| `ITimerSession`                  | I 접두사                                | `TimerSession`                                 |
| `loadSessionAsync`               | TS에선 반환 타입이 Promise임이 드러남   | `loadSession`                                  |
| `utils.ts`에 전부 몰기           | 이름이 아니라 창고                      | FSD 세그먼트로 분리 (`lib`, `model`, `config`) |
| 부정형 boolean (`isNotReady`)    | 이중 부정 발생 (`!isNotReady`)          | `isReady`                                      |
