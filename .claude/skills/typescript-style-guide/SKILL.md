---
name: react-native-typescript-style-guide
description: React Native 프로젝트에서 타입스크립트 코드를 작성할 때 타입 설계, 네이밍, 컴포넌트·스타일, 네비게이션 규칙을 일관되게 적용하는 스타일 가이드. .ts/.tsx 파일을 새로 만들거나 수정할 때, 타입·인터페이스·제네릭을 정의할 때, 화면·컴포넌트·커스텀 훅을 작성할 때, StyleSheet나 네비게이션 파라미터를 타이핑할 때, 이름을 정할 때 반드시 이 스킬을 사용할 것. 사용자가 "타입 잡아줘", "any 없애줘", "화면 만들어줘", "컴포넌트 만들어줘", "훅으로 빼줘", "스타일 분리해줘", "네비게이션 타입 잡아줘", "리팩터링해줘", "네이밍 어떻게 할까"라고 하거나, 스타일 가이드를 명시적으로 언급하지 않아도 RN 타입스크립트 코드를 생성·수정하는 상황이면 적용할 것.
---

# React Native TypeScript 스타일 가이드

React Native 프로젝트에서 타입스크립트 코드를 작성할 때 적용하는 규칙 모음이다. 목표는 두 가지다.

1. **타입이 런타임 동작을 설명하게 만든다.** 타입은 컴파일러를 통과시키는 수단이 아니라 코드를 읽는 사람에게 주는 문서다. `as`나 `any`로 컴파일러를 이기려 들면 그 문서가 거짓말을 시작한다.
2. **이름만 보고 정체를 알 수 있게 만든다.** 규칙이 균일하면 읽는 사람이 이름의 형태만 보고 값인지 타입인지 컴포넌트인지 판단할 수 있다.

## 우선순위

충돌하면 위가 이긴다.

| 순위 | 출처                                               |
| ---- | -------------------------------------------------- |
| 1    | `eslint.config.js`, `.prettierrc`, `tsconfig.json` |
| 2    | 이 문서                                            |
| 3    | Google TypeScript Style Guide                      |

## 여기서 다루지 않는 것

| 무엇                              | 맡는 곳                          |
| --------------------------------- | -------------------------------- |
| 들여쓰기, 따옴표, 줄바꿈, 줄 길이 | Prettier                         |
| 레이어·슬라이스 import 방향       | `fsd/*`, `boundaries/*`          |
| 파일 이름 대소문자                | `unicorn/filename-case`          |
| `any`, `enum`, `==`, 미사용 변수  | `@typescript-eslint/*`, `eqeqeq` |
| 주석·JSDoc 문구                   | `ko-dev-doc` 스킬                |

작업을 마치면 `pnpm check`로 이 항목들을 확인한다.

## 작업 순서

**데이터 모양부터 정한다.** 타입을 먼저 쓰고 구현을 채운다. 구현을 먼저 쓰고 타입을 나중에 맞추면 `any`와 `as`가 끼어들 자리가 생긴다. 그다음 이 순서로 판단한다.

1. **네이밍 규칙을 적용한다.** 표대로 이름을 붙인다(1장).
2. **타입을 설계한다.** 판별 유니온, 유틸리티 타입 파생, 제네릭 제약(2장).
3. **컴포넌트와 스타일 규칙을 적용한다.** Props, StyleSheet, 이벤트, ref(3장).
4. **화면 간 이동이나 플랫폼 분기가 있으면 그 규칙도 본다.** 라우트 파일, `Platform.select`, 네이티브 경계(4장).
5. **모듈과 오류 규칙을 적용한다.** export 형태, 화살표 표현식, 던지는 값(5장).
6. **마지막에 `pnpm check`를 돌리고, 도구가 못 잡는 항목만 장 순서로 다시 본다.**

규칙을 깨야 하는 순간이 온다. 깨도 되지만 **왜 깼는지 한 줄 주석을 남긴다.** 주석 없는 예외는 그냥 실수와 구분되지 않는다.

기존 파일을 수정할 때는 그 파일의 기존 컨벤션을 먼저 확인한다. 파일 전체가 다른 규칙을 따르고 있다면 이 가이드보다 **그 파일의 일관성이 우선**이다. 한 파일 안에 두 가지 스타일이 섞이는 게 가장 나쁘다.

---

## 1. 네이밍

| 대상                        | 형태                  | 예시                          |
| --------------------------- | --------------------- | ----------------------------- |
| 변수, 함수, 프로퍼티        | camelCase             | `remainingMs`, `parseSession` |
| 모듈 레벨 상수(불변 원시값) | UPPER_SNAKE_CASE      | `MINUTE_IN_MS`, `DOT_SIZE`    |
| 타입, 인터페이스, 클래스    | PascalCase            | `TimerSession`                |
| 컴포넌트                    | PascalCase            | `DotButton`                   |
| 화면 컴포넌트               | PascalCase + `Screen` | `TimerScreen`                 |
| 커스텀 훅                   | `use` + camelCase     | `useTimerSession`             |
| 제네릭 파라미터             | `T` 접두 PascalCase   | `TData`, `TError`             |
| StyleSheet 객체             | `styles` 고정         | —                             |

**접두·접미**

- 인터페이스에 `I`를 붙이지 않고, 타입에 `Type`을 붙이지 않는다.
- boolean은 `is` / `has` / `should` / `can`으로 시작한다. 부정형(`isNotReady`)은 만들지 않는다.
- 배열은 복수형(`positions`, `RIVETS`). `List`, `Array`, `Data` 접미사는 타입에 이미 있는 정보다.
- 함수는 동사로 시작한다. `get`은 동기 조회, 네트워크를 타면 `fetch`.
- 컴포넌트 내부 핸들러는 `handle`, props로 받는 콜백은 `on`. 이 구분이 있으면 정의부만 보고 자기 동작인지 주입된 동작인지 안다.

**파일**

- 컴포넌트·훅 파일은 대상 이름과 동일: `DotButton.tsx`, `useTimerSession.ts`
- `.tsx`는 PascalCase, `.ts`는 camelCase. `unicorn/filename-case`가 강제한다
- kebab-case는 폴더에만 쓴다: `dot-button/`, `dot-sprite/`
- 슬라이스 공개 API는 `index.ts`. FSD가 슬라이스마다 요구한다
- 플랫폼 분기는 확장자로: `.ios.tsx` / `.android.tsx` / `.native.tsx` / `.web.tsx`
- **플랫폼별 파일은 Props 타입을 `*.types.ts`에서 공유한다.** 각자 선언하면 한쪽만 고쳐도 컴파일이 통과해 시그니처가 조용히 어긋난다.

상세한 판단 기준(이름 길이, 동사 선택표, 계층별 도메인 타입 접미사, 안티패턴)은 `references/naming.md`.

---

## 2. 타입 설계

**any 대신 unknown.** `any`는 타입 검사를 끄는 스위치라 그 값이 흘러가는 모든 경로에서 검사가 사라진다.

```ts
export const parseSession = (raw: string | null): TimerSession | null => {
  if (raw === null) return null;

  // JSON.parse는 any를 돌려준다. unknown으로 받아야 그 뒤가 검사된다
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null) return null;
  return toSession(value);
};
```

**단언과 non-null은 검사로 대체한다.** `as`는 컴파일러만 조용하게 만든다. 객체 리터럴에 붙이는 `as`는 lint가 막지만 `value as Record<string, unknown>` 같은 좁히기 단언은 통과하므로, 런타임 검사를 마친 자리인지는 사람이 본다. `!`는 `no-non-null-assertion`이 `warn`이라 커밋을 막지 않는다 — `noUncheckedIndexedAccess`가 켜져 있어 배열 인덱스 접근마다 걸리기 때문이다. 명시적 분기나 early return으로 바꾼다.

**interface와 type.** 객체 형태이고 확장될 여지가 있으면 `interface`, 유니온·교차·튜플·매핑·함수 시그니처면 `type`. 둘 다 되는 경우엔 파일 안에서 일관되게만 쓴다.

**상태는 판별 유니온으로.** boolean을 나열하면 존재할 수 없는 조합까지 타입이 허용한다.

```ts
type TimerSession =
  | { phase: 'idle'; mode: TimerMode }
  | { phase: 'running'; mode: TimerMode; endsAt: number }
  | { phase: 'paused'; mode: TimerMode; pausedRemainingMs: number }
  | { phase: 'done'; mode: TimerMode };
```

`endsAt`은 진행일 때만, `pausedRemainingMs`는 일시정지일 때만 존재한다. 둘을 optional로 나란히 두면 둘 다 없는 진행 상태가 타입에서 허용된다.

`switch`의 `default`에서 `never` 할당으로 누락을 컴파일 타임에 잡는다.

**없음은 optional로.** `| undefined` 대신 `?`를 쓴다. 별칭 자체에 `| null`이나 `| undefined`를 넣지 않고, 없을 수 있다는 사실은 그 값을 실제로 쓰는 자리에 적는다.

**배열은 `T[]`.** 원소가 이름 하나로 끝나면 `T[]`, `readonly T[]`를 쓴다. 제네릭이 들어가 길어지면 `Array<T>`를 쓴다.

**파생은 유틸리티 타입으로.** 같은 모양을 두 번 쓰지 않는다.

```ts
type SettingMinutes = Record<TimerMode, number>;
type MinutesRange = Record<TimerMode, { min: number; max: number }>;
```

**제네릭은 관계를 표현할 때만.** 타입 파라미터가 시그니처에 한 번만 등장하면 제네릭이 필요 없다. 그건 복잡한 `any`다.

**명시할 것과 맡길 것.** export 함수의 반환 타입은 명시하고, 지역 변수는 추론에 맡긴다. 빈 배열·null 초기값은 명시한다.

전체 규칙(단언 대신 `satisfies`, 타입 가드 작성법, exhaustive check, 제네릭 제약, `readonly`, `any`를 허용하는 예외)은 `references/type-design.md`.

---

## 3. 컴포넌트와 스타일

**Props**

```tsx
interface ControlsProps extends ViewProps {
  session: TimerSession;
  enabled?: boolean;
  onPlay: () => void;
  onStop: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Controls = ({ session, enabled = true, onPlay, onStop, ...rest }: ControlsProps) => {};
```

- 타입 이름은 `컴포넌트명 + Props`
- `React.FC`를 쓰지 않는다. 제네릭 표현이 안 되고 반환 타입 제약만 붙는다.
- 기본값은 타입의 `?`가 아니라 구조 분해에서 준다.
- RN 기본 컴포넌트를 감싸면 `ViewProps` / `TextProps` / `PressableProps` / `TextInputProps`를 확장한다.
- 외부에서 받는 스타일 prop은 `StyleProp<ViewStyle>`. `ViewStyle`로 받으면 배열 스타일을 못 넘긴다.

**스타일**

- `StyleSheet.create`는 추론이 되므로 타입을 붙이지 않는다.
- `ViewStyle`(레이아웃) / `TextStyle`(폰트, ViewStyle 포함) / `ImageStyle`(resizeMode)을 구분해 쓴다.
- 조건부 스타일은 배열로: `style={[styles.root, pressed && styles.pressed]}`
- 스타일을 만들어 반환하는 함수는 반환 타입을 명시한다. 안 그러면 `fontWeight: '600'`이 `string`으로 넓어져 터진다.

**이벤트**

| 상황             | 타입                                             |
| ---------------- | ------------------------------------------------ |
| `onPress`        | `(event: GestureResponderEvent) => void`         |
| 텍스트 입력      | `onChangeText: (text: string) => void`           |
| 입력 원본 이벤트 | `NativeSyntheticEvent<TextInputChangeEventData>` |
| 스크롤           | `NativeSyntheticEvent<NativeScrollEvent>`        |
| 레이아웃 측정    | `(event: LayoutChangeEvent) => void`             |

**ref와 리스트**

`useRef<View>(null)`, `useRef<TextInput>(null)` — DOM 엘리먼트가 아니라 RN 컴포넌트를 넣는다. 리스트를 쓰면 아이템 타입까지 넣고(`useRef<FlatList<T>>(null)`), 밖으로 뺀 `renderItem`은 `ListRenderItem<T>`.

worklet이 읽어야 하는 값은 `useRef`가 아니라 `useSharedValue`로 둔다.

**커스텀 훅 반환**은 객체가 기본. 호출부에서 이름을 자유롭게 지어야 할 때만 튜플 + `as const`.

제네릭 컴포넌트, Context, `useImperativeHandle`, children 타입 선택, 판별 유니온 Props, Reanimated는 `references/components-and-styles.md`.

---

## 4. 네비게이션과 플랫폼 경계

**라우트는 파일 구조가 정한다.** Expo Router는 `app/` 아래 파일 배치가 곧 경로다. 라우트 파일만 `export default`를 쓰고, 그 밖에서는 named export를 쓴다.

```
src/app/
├── _layout.tsx          ← 프로바이더 자리
└── (tabs)/
    ├── _layout.tsx      ← 탭 바 설정
    ├── index.tsx
    └── settings.tsx
```

**파라미터는 언제나 문자열이다.** `useLocalSearchParams`의 제네릭에 유니온을 적어도 그 값이 온다는 보장이 없다. 검사 없이 좁히는 것은 2장이 막는 단언과 같다.

```tsx
const { mode } = useLocalSearchParams<{ mode: string }>();
if (!isMode(mode)) return null;
```

**플랫폼 분기.** `Platform.OS` 비교는 타입이 좁혀진다. 값 분기는 `Platform.select<ViewStyle>({...})`로 반환 타입을 고정하고 `default`를 채운다.

**네이티브 경계.** Expo 모듈(`requireNativeModule`)과 `NativeModules.X`는 `any`로 나온다. 인터페이스를 선언해 **경계에서 한 번만** 단언하고, 그 뒤로는 타입이 붙은 상태로 흐르게 한다. 이미지·폰트 같은 자산은 `*.d.ts`로 모듈 선언을 만들고 `ImageSourcePropType`으로 받는다.

탭 레이아웃, `Href`와 이동, typedRoutes, 자산 선언 예시는 `references/navigation-and-platform.md`.

---

## 5. 모듈과 오류

**모듈**

- named export만 쓴다. 라우트 파일만 예외로 `export default`를 쓴다
- 슬라이스 밖에서 쓰는 것만 export한다
- `export let`을 쓰지 않는다. 바뀌는 값은 함수로 내보낸다
- `namespace`, `import x = require(...)`를 쓰지 않는다
- 정적 멤버만 모아 둔 클래스를 만들지 않는다. 함수와 상수를 따로 내보낸다
- 타입으로만 쓰는 것은 `type`을 표시한다. 인라인 형태를 쓴다

```ts
import { type PausedSession, type RunningSession } from './session';
```

- 타입을 다시 내보낼 때는 `export type`을 쓴다. `verbatimModuleSyntax`가 켜져 있어 표시가 없으면 컴파일되지 않는다

**함수**

- 이름 붙은 함수는 화살표 표현식으로 쓴다. `func-style: ['error', 'expression']`이 강제한다
- 매개변수가 셋 이상이거나 순서가 자연스럽지 않으면 객체 하나로 받고 구조 분해한다
- 콜백은 화살표로 감싸 인자를 명시적으로 넘긴다. 받는 쪽이 나중에 인자를 늘려도 조용히 딸려 들어가지 않는다

```ts
// 이렇게
minutes.map((minute) => formatMinute(minute));

// 이러지 않는다
minutes.map(formatMinute);
```

- 반환값을 쓰지 않는 화살표 함수는 중괄호 본문으로 쓴다. 간결 본문은 반환값을 쓸 때만 쓴다
- 기본값 인자에 부수 효과를 넣지 않는다

**오류**

- `new Error(...)`로 만든다
- `Error`나 그 하위 클래스만 던지고 reject한다. 그 밖의 값은 스택이 남지 않는다
- catch에서 `Error`가 아닌 값을 방어하지 않는다. 그렇게 던지는 외부 API가 있으면 어디서 오는지 주석으로 적는다
- 아무것도 하지 않는 catch에는 그래도 되는 이유를 적는다
- `try` 안에는 실제로 던지는 호출만 둔다

---

## 감사

기존 코드를 점검할 때 순서다.

1. `pnpm check`를 먼저 돌린다. 도구가 잡는 것은 도구가 잡게 두고 결과를 그대로 보고한다
2. 남은 항목만 이 문서의 장 순서대로 훑는다 — 네이밍, 타입 설계, 컴포넌트, 네비게이션, 모듈과 오류
3. 위반마다 `파일:줄`과 어느 항목인지 적는다. 고칠 안을 함께 낸다
4. 고칠 때는 기능 변경과 섞지 않는다. `refactor`로 분리하고 커밋 200줄·8파일 상한을 지킨다
