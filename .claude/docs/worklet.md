# worklet과 스레드 모델

작성 기준 버전

| 패키지                    | 버전   | Reanimated 4.5.x가 요구하는 범위 |
| ------------------------- | ------ | -------------------------------- |
| `react-native-reanimated` | 4.5.1  | —                                |
| `react-native-worklets`   | 0.10.1 | 0.10.x                           |
| `react-native`            | 0.86.2 | 0.83 ~ 0.86                      |

- 범위의 출처는 `react-native-reanimated/compatibility.json`이다
- Reanimated 4는 New Architecture 전용이다

## 1. 스레드와 런타임

스레드는 OS의 실행 단위이고 런타임은 JavaScript 실행 환경이다. 층위가 다르므로 나눠서 본다.

### JS 스레드

- 앱의 JavaScript가 실행되는 스레드다. React의 render phase와 레이아웃 계산이 여기에 속한다
- Worklets 문서는 이 스레드의 JavaScript 런타임을 RN Runtime이라 부른다. 앱당 하나다

### UI 스레드

- 호스트 뷰(native view)를 조작할 수 있는 유일한 스레드다. Main thread라고도 부른다
- 이 스레드에도 JavaScript 런타임이 하나 있다. Worklets 문서의 UI Runtime이며, 여기서 실행되는 것은 worklet뿐이다

### Worker Runtime

- `createWorkletRuntime`이 만드는 세 번째 런타임이다. JS 스레드와 UI 스레드가 아닌 스레드에서 worklet을 실행한다
- `getRuntimeKind`는 `RuntimeKind.ReactNative`·`UI`·`Worker` 중 하나를 반환한다 (`react-native-worklets/lib/typescript/runtimeKind.d.ts`)

### 런타임 간 값 전달

- 두 런타임은 같은 객체를 참조로 공유하지 못한다. 전달하는 값은 직렬화(serialize)된다
- UI 런타임에서 `scheduleOnRN`을 호출하면 함수와 인자를 직렬화한 뒤 JSScheduler를 거쳐 RN CallInvoker의 `invokeAsync`로 JS 스레드에 예약한다 (`react-native-worklets/lib/module/threads.native.js`)
- `scheduleOnUI`도 비동기다. 호출한 프레임 안에서 실행된다는 보장이 없다
- JS 스레드가 렌더링에 점유되면 예약된 콜백이 그만큼 지연되고 프레임을 넘긴다

### 프레임 예산

- 60Hz의 프레임 예산은 16.7ms, 120Hz는 8.3ms다
- 값 계산이 JS 스레드에 있는 애니메이션은 그 스레드가 리스트 렌더링이나 JSON 파싱에 점유되는 동안 함께 멈춘다. JSI에서 직렬화 비용은 낮아졌으나 점유 자체는 남는다. 두 방식의 비용 수치는 확인하지 못했다
- worklet은 이 계산을 UI Runtime으로 옮긴다. JS 스레드가 점유된 상태에서도 드래그 반응이 유지된다

## 2. worklet 정의와 변환

### 정의

- Worklets 문서의 정의는 "Worklet is a short-running JavaScript function that can be moved and executed across different Worklet Runtimes"다
- 함수 본문 첫 줄에 `'worklet'` 지시어를 두면 그 함수가 worklet이 된다

```ts
export const millisecondsToSeconds = (ms: number): number => {
  'worklet';
  return Math.max(0, Math.ceil(ms / 1000));
};
```

### babel 플러그인

- Worklets Babel plugin이 `'worklet'` 지시어가 붙은 함수를 직렬화 가능한 객체로 변환한다. 이 변환을 workletize라 부른다
- 지시어 자체는 런타임에 아무 동작도 하지 않는다. 빌드 시점에 플러그인이 읽는 표시다

### 자동 workletize

- 플러그인은 등록된 API의 인라인 콜백을 지시어 없이 자동으로 변환한다. 목록은 `react-native-worklets/plugin/index.js`의 `reanimatedFunctionArgsToWorkletize`에 있다

| 분류                | 대상                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Reanimated 훅       | `useFrameCallback`, `useAnimatedStyle`, `useAnimatedProps`, `useDerivedValue`, `useAnimatedScrollHandler`, `useAnimatedReaction`의 콜백    |
| 애니메이션 콜백     | `withTiming`, `withSpring`, `withDecay`, `withRepeat`의 완료 콜백                                                                          |
| 스케줄링 함수       | `scheduleOnUI`·`runOnUISync`·`runOnUIAsync`의 0번 인자. `scheduleOnRuntime`·`runOnRuntime` 계열은 0번이 런타임 객체라 1번 인자             |
| Gesture 빌더 메서드 | `onBegin`, `onStart`, `onEnd`, `onFinalize`, `onUpdate`, `onChange`, `onTouchesDown`, `onTouchesMove`, `onTouchesUp`, `onTouchesCancelled` |

- `useCallback`·`useMemo`는 목록에 없다. 그 안에 넣은 함수는 인라인이어도 지시어를 직접 붙인다
- 다른 파일에서 import한 함수도 자동 대상이 아니다
- 지시어가 필요한지는 UI 스레드에서 그 함수를 호출하는지로 판단한다. 파일 위치나 세그먼트는 기준이 아니다

### Expo 프로젝트의 설정

- `babel-preset-expo`는 `react-native-worklets`가 설치돼 있으면 `react-native-worklets/plugin`을 자동으로 추가한다 (`babel-preset-expo/build/configs/expo.js`)
- 따라서 `babel.config.js`를 따로 두지 않아도 지시어가 동작한다

## 3. 제약

### 클로저 캡처

- worklet은 바깥 스코프의 변수를 캡처한다. 캡처는 호출 시점의 복사본이고, 런타임이 다르면 참조를 공유하지 않는다
- 본문에서 참조하는 변수만 캡처된다
- 객체의 속성 하나만 사용해도 객체 전체가 캡처된다. 사용할 값을 먼저 별도 변수에 담는다

### 공유 값(shared value)

- `useSharedValue`가 만드는 값은 두 스레드에서 같은 값을 읽고 쓴다. 캡처 복사본과 달리 갱신이 양쪽에 반영된다
- 양쪽에서 함께 참조해야 하는 값에는 캡처가 아니라 공유 값을 쓴다

### 훅의 실행 런타임

| 훅                         | 콜백의 실행 런타임 | 용도                     |
| -------------------------- | ------------------ | ------------------------ |
| `useSharedValue`           | 양쪽이 공유        | 런타임 간 공유되는 값    |
| `useAnimatedStyle`         | UI Runtime         | 스타일 계산. 매 프레임   |
| `useDerivedValue`          | UI Runtime         | 공유 값에서 파생한 값    |
| `useAnimatedReaction`      | UI Runtime         | 값 변화 감지 후 부수효과 |
| `useAnimatedScrollHandler` | UI Runtime         | 스크롤 이벤트            |
| `useFrameCallback`         | UI Runtime         | 프레임 단위 콜백         |

- 훅 자체는 JS 스레드에서 호출된다. UI Runtime으로 넘어가는 것은 인자로 전달한 콜백이다

### 직렬화

- worklet에 전달하는 인자와 캡처 값은 직렬화된다
- 이미 전달한 객체의 키를 나중에 수정하면 경고가 출력된다. ``Tried to modify key `<키>` of an object which has been already passed to a worklet.`` (`react-native-worklets/lib/module/memory/serializable.native.js`)
- 상태가 바뀌는 값은 객체 캡처가 아니라 공유 값으로 전달한다

### worklet이 아닌 함수

- 대부분의 외부 라이브러리 함수에는 `'worklet'`이 없다. UI 스레드에서 직접 호출하지 못하므로 `scheduleOnRN`으로 JS 스레드에 넘긴다
- `scheduleOnRN`은 worklet도 받는다. worklet이면 `runWorkletOnJS`로 감싸 JS 스레드에서 실행하고, 아니면 remote function으로 넘긴다 (`react-native-worklets/lib/module/threads.native.js`)

### UI Runtime 부하

- UI Runtime에서 무거운 연산을 수행하면 뷰 렌더링이 지연된다. 연산을 옮기면 병목 지점도 옮겨진다
- UI → JS 호출을 매 프레임 수행하면 프레임마다 직렬화와 JS 스레드 예약이 발생해 worklet으로 옮긴 이득이 상쇄된다
- 상태 동기화는 값이 실제로 바뀐 시점이나 제스처 종료 시점으로 한정한다

## 4. 런타임 간 실행 API

### 방향별 API

| 방향     | 함수                | 동기 여부                            |
| -------- | ------------------- | ------------------------------------ |
| JS → UI  | `scheduleOnUI`      | 비동기                               |
| JS → UI  | `runOnUISync`       | 동기. 반환할 때까지 JS 스레드를 막음 |
| UI → JS  | `scheduleOnRN`      | 비동기                               |
| → Worker | `scheduleOnRuntime` | 비동기                               |

- `scheduleOnUI`와 `runOnUISync`는 UI Runtime과 Worker Runtime에서 호출하지 못한다. Bundle Mode를 켜면 `scheduleOnUI`만 예외다 (`react-native-worklets/lib/module/threads.native.js`)
- `scheduleOnRN`은 모든 런타임에서 호출할 수 있다. RN Runtime에서 호출하면 `queueMicrotask`로 위임한다

### 현행 이름과 deprecated 이름

| 0.10.1의 현행 이름 | 이전 이름 | 상태                                                |
| ------------------ | --------- | --------------------------------------------------- |
| `scheduleOnUI`     | `runOnUI` | 이전 이름은 `@deprecated`. 다음 major에서 제거 예정 |
| `scheduleOnRN`     | `runOnJS` | 이전 이름은 `@deprecated`. 다음 major에서 제거 예정 |

- 공식 문서의 `runOnUI`·`runOnJS` 페이지에 "This API is deprecated and will be removed in the next major release. Use scheduleOnUI instead." / "... Use scheduleOnRN instead."가 적혀 있다
- 설치된 0.10.1의 `react-native-worklets/lib/module/threads.native.js`에도 같은 `@deprecated` 태그가 있다
- `react-native-reanimated`는 `runOnJS`·`runOnUI`만 재export한다. `scheduleOnRN`·`scheduleOnUI`는 `react-native-worklets`에서만 import할 수 있다 (`react-native-reanimated/lib/typescript/index.d.ts`)

### 호출 형태

```ts
// 이전 이름: 함수를 전달하면 함수가 반환된다. 그 함수를 다시 호출한다
runOnJS(setValue)(next);

// 현행 이름: 함수와 인자를 한 번에 전달한다. 반환값은 void
scheduleOnRN(setValue, next);
```

- 이전 형태를 그대로 옮겨 `scheduleOnRN(setValue)(next)`로 작성하면, 인자 없이 한 번 예약한 뒤 반환값 `undefined`를 호출한다

## 5. Bundle Mode

- 기본값은 꺼짐이다. `isBundleModeEnabled()`가 `false`를 반환한다 (`react-native-worklets/lib/module/debug/bundleMode.js`)
- 켜면 worklet이 번들 전체에 접근한다. `'worklet'`이 없는 외부 라이브러리 함수도 UI 스레드에서 호출할 수 있다
- 활성화에는 babel 플러그인의 `bundleMode` 옵션, Metro 설정 변경, Metro 패키지 패치가 필요하다
- `workletizableModules` 옵션은 `importForwarding`으로 대체됐다. 설치된 플러그인에는 `importForwarding`만 있다 (`react-native-worklets/plugin/index.js`). 이전 설정 예제를 그대로 복사하면 동작하지 않는다
- Worklet Runtime에는 네트워킹이 기본 제공되지 않는다. `fetch`를 쓰려면 정적 플래그 `FETCH_PREVIEW_ENABLED`를 켠다 (`react-native-worklets/lib/typescript/featureFlags/types.d.ts`)
- 이 문서의 나머지는 꺼진 상태를 전제한다. 3절의 직렬화와 클로저 캡처가 여기에 해당한다

## 6. 지시어 누락의 검출

### TypeScript

- `scheduleOnUI`의 타입은 `(worklet: (...args: Args) => ReturnValue, ...args: Args) => void`다 (`react-native-worklets/lib/typescript/threads.d.ts`)
- 첫 인자는 일반 함수 타입이다. worklet 여부가 타입으로 구별되지 않는다. 타입 검사는 지시어가 빠져도 통과한다

### Jest

- worklet은 정의된 런타임에서 일반 함수다. Node에서 직접 호출하면 지시어 유무와 무관하게 같은 값을 반환한다
- 순수 함수를 직접 호출하는 단위 테스트는 지시어를 지워도 통과한다

### ESLint

- 지시어 누락을 검사하는 규칙이 없다

### 실기기 실행

- `__DEV__`에서 `scheduleOnUI`는 인자가 worklet이 아니면 ``[Worklets] `scheduleOnUI` can only be used with worklets.``를 던진다 (`react-native-worklets/lib/module/threads.native.js`)
- UI Runtime에서 remote function을 동기 호출하면 `[Worklets] Tried to synchronously call a Remote Function. Called "<이름>" on the <런타임> Runtime.`이 발생한다 (`react-native-worklets/lib/module/memory/remoteFunctionUnpacker.native.js`)
- 지시어 누락은 정적 검사 세 단계를 모두 통과하고 실기기 실행 시점에만 드러난다

## 7. 참고 링크

- [Glossary of terms — React Native Worklets](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/glossary)
- [Runtime Kinds — React Native Worklets](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/runtimeKinds)
- [Understanding closures — React Native Worklets](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/closures/)
- [Worklets Babel plugin: About](https://docs.swmansion.com/react-native-worklets/docs/worklets-babel-plugin/about/)
- [scheduleOnUI](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnUI)
- [scheduleOnRN](https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN)
- [runOnUISync](https://docs.swmansion.com/react-native-worklets/docs/threading/runOnUISync)
- [Bundle Mode — React Native Worklets](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/)
- [runOnUI (deprecated)](https://docs.swmansion.com/react-native-worklets/docs/threading/runOnUI)
- [runOnJS (deprecated)](https://docs.swmansion.com/react-native-worklets/docs/threading/runOnJS)
- [Troubleshooting — React Native Worklets](https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting/)
- [Glossary — React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary)
- [Worklets — React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/)
- [useFrameCallback — React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback)
- [Compatibility — React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
- [Threading Model — React Native](https://reactnative.dev/architecture/threading-model)
