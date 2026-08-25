# 타입 설계 심화

SKILL.md 2장의 근거와 예외 케이스를 다룬다.

## 목차

1. [unknown 좁히기](#unknown-좁히기)
2. [단언 대신 satisfies](#단언-대신-satisfies)
3. [타입 가드 작성법](#타입-가드-작성법)
4. [판별 유니온과 exhaustive check](#판별-유니온과-exhaustive-check)
5. [제네릭 제약](#제네릭-제약)
6. [유틸리티 타입 목록](#유틸리티-타입-목록)
7. [명시할 것과 추론에 맡길 것](#명시할-것과-추론에-맡길-것)
8. [readonly와 불변성](#readonly와-불변성)
9. [any를 허용하는 예외](#any를-허용하는-예외)

---

## unknown 좁히기

`unknown`은 아무 연산도 허용하지 않으므로 반드시 좁혀야 쓸 수 있다. 이 강제가 `any`와의 차이다.

```ts
const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '알 수 없는 오류가 발생했습니다';
};
```

`catch` 블록의 파라미터는 기본이 `unknown`이다(`useUnknownInCatchVariables`). 여기서 `error.message`에 바로 접근하려 들면 안 된다. 네트워크 에러와 코드 버그가 같은 자리로 떨어지기 때문에 좁히기가 특히 중요하다.

## 단언 대신 satisfies

`as`는 "컴파일러야 그냥 믿어"라는 뜻이라 실제 값이 달라도 잡히지 않는다.

```ts
// 나쁨: 오타가 있어도 통과. `consistent-type-assertions`가 이 형태를 막는다
const focusRange = { min: 1, mx: 60 } as MinutesRange;

// 좋음: 제약은 검사하되 리터럴 타입은 유지
const focusRange = { min: 1, max: 60 } satisfies MinutesRange;
```

`satisfies`의 이점은 **검사와 추론을 동시에** 얻는 것이다. 타입 표기(`const focusRange: MinutesRange = ...`)는 검사는 되지만 값이 넓은 타입으로 고정된다.

```ts
const TIMER_DEFAULT = {
  focus: 25,
  rest: 5,
} satisfies Record<TimerMode, number>;

type DefaultMinutes = (typeof TIMER_DEFAULT)[keyof typeof TIMER_DEFAULT];  // 25 | 5
```

`as unknown as T` 같은 이중 단언은 거의 항상 설계가 잘못됐다는 신호다.

## 타입 가드 작성법

런타임 값을 좁혀야 하면 가드 함수를 만든다.

```ts
const isPhase = (value: unknown): value is TimerPhase => TIMER_PHASES.some((phase) => phase === value);

const isSession = (value: unknown): value is TimerSession =>
  typeof value === 'object' && value !== null && 'phase' in value && isPhase(value.phase);
```

가드 함수는 **거짓말할 수 있다.** 반환 타입에 `value is TimerSession`이라고 써놓고 실제로는 아무것도 검사하지 않아도 컴파일된다. 검사 항목이 많거나 중첩 구조라면 스키마 검증 라이브러리로 넘기는 게 낫다.

단언 시그니처는 throw까지 하는 버전이다. **화살표로 쓸 때는 타입 표기를 반드시 붙인다** — 없으면 호출부에서 `TS2775: Assertions require every name in the call target to be declared with an explicit type annotation`이 난다.

```ts
const assertIsSession: (value: unknown) => asserts value is TimerSession = (value) => {
  if (!isSession(value)) throw new Error('타이머 세션 형식이 아닙니다');
};
```

## 판별 유니온과 exhaustive check

boolean 플래그를 나열하면 실제로 존재할 수 없는 조합까지 타입이 허용한다.

```ts
// 나쁨: 진행인데 끝날 시각이 없는 조합까지 허용된다
interface TimerSession {
  phase: TimerPhase;
  mode: TimerMode;
  endsAt?: number;
  pausedRemainingMs?: number;
}

// 좋음
type TimerSession =
  | { phase: 'idle'; mode: TimerMode }
  | { phase: 'running'; mode: TimerMode; endsAt: number }
  | { phase: 'paused'; mode: TimerMode; pausedRemainingMs: number }
  | { phase: 'done'; mode: TimerMode };
```

`switch`에서 누락을 컴파일 타임에 잡는다. 나중에 유니온에 멤버를 추가하면 이 자리에서 에러가 난다.

```ts
switch (session.phase) {
  case 'idle':
    return null;
  case 'running':
    return session.endsAt - now;
  case 'paused':
    return session.pausedRemainingMs;
  case 'done':
    return 0;
  default: {
    const exhaustive: never = session;
    throw new Error(`처리하지 않은 단계: ${JSON.stringify(exhaustive)}`);
  }
}
```

## 제네릭 제약

**타입 파라미터가 시그니처에서 한 번만 등장하면 제네릭이 필요 없다.**

```ts
// 불필요: T가 입력에만 등장 → unknown이면 된다
const log = <T>(value: T): void => { /* ... */ };

// 필요: 입력과 출력의 관계를 표현
const first = <T>(items: readonly T[]): T | undefined => items[0];
```

`extends`로 제약을 걸어 내부에서 안전하게 접근한다.

```ts
const pluck = <T, K extends keyof T>(items: T[], key: K): T[K][] => items.map((item) => item[key]);
```

기본값을 줄 수 있다. 다만 기본값이 `any`면 제네릭을 쓰는 의미가 없어진다.

```ts
interface Stored<TValue = unknown> {
  value: TValue;
  savedAt: number;
}
```

추론이 원하지 않는 방향으로 넓어지면 `NoInfer`로 특정 자리를 추론 대상에서 뺀다.

```ts
const withFallback = <T>(value: T | null, fallback: NoInfer<T>): T => value ?? fallback;
```

## 유틸리티 타입 목록

| 타입                              | 용도                     |
| --------------------------------- | ------------------------ |
| `Pick<T, K>` / `Omit<T, K>`       | 필드 골라내기 / 빼기     |
| `Partial<T>` / `Required<T>`      | 전부 옵셔널 / 전부 필수  |
| `Readonly<T>`                     | 전부 읽기 전용           |
| `Record<K, V>`                    | 키-값 맵                 |
| `ReturnType<F>` / `Parameters<F>` | 함수 반환·인자 타입 추출 |
| `Awaited<T>`                      | Promise 벗기기           |
| `Extract<T, U>` / `Exclude<T, U>` | 유니온 필터링            |
| `NonNullable<T>`                  | null·undefined 제거      |

유니온에서 특정 멤버만 뽑을 때 `Extract`가 유용하다.

```ts
type RunningSession = Extract<TimerSession, { phase: 'running' }>;
```

`Omit`은 키 이름을 검사하지 않는다. 오타가 나도 통과하므로 중요한 자리엔 `Omit<T, keyof Pick<T, 'id'>>`처럼 검사되는 형태를 쓴다.

## 명시할 것과 추론에 맡길 것

**export 하는 함수의 반환 타입은 명시한다.** 구현이 바뀌었을 때 반환 타입이 조용히 달라져 호출부까지 번지는 걸 막는다. `explicit-module-boundary-types`가 강제한다.

반환이 객체라 길어지면 별도 타입으로 뽑는다 — `TimerSpeed`, `TimerSessionState`. 컴포넌트는 `JSX.Element`이고 `import { type JSX } from 'react'`가 필요하다.

```ts
export const startTimer = ({ session, now, settingMs }: StartInput): RunningSession => ({ ... });
```

**지역 변수는 추론에 맡긴다.** `const count: number = 0`은 오른쪽이 이미 말하는 것을 왼쪽에 한 번 더 적은 것이다.

**빈 배열과 `null` 초기값은 자리에 따라 다르다.**

| 코드                  | 추론                              |
| --------------------- | --------------------------------- |
| `const items = []`    | `any[]` — 값을 넣으면 넓어진다    |
| `useState([])`        | `never[]` — 아무것도 넣을 수 없다 |
| `const stored = null` | `null`                            |
| `useState(null)`      | `null`                            |

제네릭 자리에 빈 배열을 넘기면 `never[]`로 굳어 `push`조차 막힌다. `null`은 자리와 무관하게 `null`로 굳는다. 둘 다 타입을 적어 연다.

```ts
const [minutes, setMinutes] = useState<number[]>([]);
const [session, setSession] = useState<TimerSession | null>(null);
```

## readonly와 불변성

- 수정하지 않을 배열 파라미터는 `readonly T[]`로 받는다. 함수가 인자를 건드리지 않는다는 보장이 시그니처에 드러난다.
- 변경 의도가 없는 프로퍼티는 `readonly`를 붙인다.
- 상수 객체는 `as const`로 굳힌다. 중첩 객체까지 전부 읽기 전용이 된다.

`readonly`는 컴파일 타임 전용이다. 런타임 불변이 필요하면 `Object.freeze`를 따로 쓴다.

## any를 허용하는 예외

`no-explicit-any`가 `error`라 사유 주석만으로는 통과하지 않는다. 규칙명을 적은 disable을 붙이고 그 위에 사유를 남긴다. 규칙명 없는 disable은 `unicorn/no-abusive-eslint-disable`이 막는다.

```ts
// 라이브러리 타입 정의가 실제 반환과 달라 경계에서만 받는다
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw: any = fromLibrary();
```

두 경우가 해당한다.

1. **타입 정의가 없거나 틀린 서드파티 경계.** 경계에서 한 번만 좁히고 그 뒤로는 타입이 붙은 상태로 흐르게 한다.
2. **제네릭 제약 자리.** `T extends (...args: any[]) => any` 같은 형태는 관용적이며 `unknown`으로 바꾸면 할당이 막힌다. 이 자리도 봐주지 않으므로 같은 disable이 필요하다.

`any` 대신 `@ts-expect-error`를 고려한다. 에러가 사라지면 컴파일러가 알려주므로 부채가 저절로 드러난다. `ban-ts-comment`가 3자 이상 사유를 요구하므로 설명 없이는 붙일 수 없다.
