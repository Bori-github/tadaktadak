# 네비게이션과 플랫폼 경계

SKILL.md 4장의 상세 규칙이다. Expo Router 기준으로 적었다. 라우트를 파일 구조가 정하고 파라미터를 `useLocalSearchParams()`로 읽는 모델이다.

## 목차

1. [라우트 파일 규칙](#라우트-파일-규칙)
2. [파라미터 타이핑](#파라미터-타이핑)
3. [탭과 그룹](#탭과-그룹)
4. [이동과 Href](#이동과-href)
5. [플랫폼 분기](#플랫폼-분기)
6. [네이티브 모듈 타이핑](#네이티브-모듈-타이핑)
7. [자산 모듈 선언](#자산-모듈-선언)

---

## 라우트 파일 규칙

`app/` 아래 파일 구조가 곧 라우트다. ParamList 같은 등록 타입이 없다.

```
src/app/
├── _layout.tsx          ← 루트 레이아웃
└── (tabs)/
    ├── _layout.tsx      ← 탭 바 설정
    ├── index.tsx        ← 첫 탭
    └── settings.tsx
```

- **라우트 파일은 `export default`를 쓴다.** Expo Router가 default export로 화면을 찾는다. 라우트 파일에만 해당하고, 그 밖에서는 named export를 쓴다.
- `_layout.tsx`는 그 폴더의 프로바이더 자리다. 화면이 아니라 껍데기다.
- 괄호로 감싼 폴더(`(tabs)`)는 URL에 나타나지 않는다. 묶음만 만든다.
- 대괄호는 동적 구간이다 — `[id].tsx`, 나머지 전부를 받으면 `[...rest].tsx`.

**라우트 파일명은 `unicorn/filename-case` 예외가 필요하다.** 이 저장소는 `.tsx`에 pascalCase를 강제하는데 Expo Router는 `_layout.tsx`·`settings.tsx`처럼 소문자를 요구한다. 도입할 때 `eslint.config.js`에서 `src/app/**`를 규칙 대상에서 빼거나 별도 설정을 준다.

```
error  Filename is not in pascal case. Rename it to `_Layout.tsx`  unicorn/filename-case
```

진입점도 바뀐다. `package.json`의 `main`이 `expo-router/entry`가 되고 `registerRootComponent`를 직접 부르지 않는다.

## 파라미터 타이핑

`useLocalSearchParams`로 읽는다. 제네릭에 모양을 적는다.

```tsx
const { mode } = useLocalSearchParams<{ mode: string }>();
```

**URL에서 온 값은 언제나 문자열이다.** 제네릭에 `{ mode: TimerMode }`라고 적어도 실제로 그 값이 온다는 보장이 없다. 좁히기는 직접 한다.

```tsx
const { mode } = useLocalSearchParams<{ mode: string }>();
if (!isMode(mode)) return null;
// 여기서부터 TimerMode
```

제네릭에 유니온을 바로 적는 것은 SKILL.md 2장이 막는 단언과 같다. 검사 없이 타입만 좁히는 셈이다.

`[...rest]` 같은 나머지 구간은 **배열**로 온다.

```tsx
const { rest } = useLocalSearchParams<{ rest: string[] }>();
```

`useGlobalSearchParams`는 URL이 바뀔 때마다 화면 밖에서도 갱신돼 불필요한 리렌더링을 만든다. 기본은 `useLocalSearchParams`다.

`app.json`의 `experiments.typedRoutes`를 켜면 라우트 문자열을 제네릭으로 넘길 수 있다. 아직 베타다.

```tsx
const { profile, search } = useLocalSearchParams<'/[profile]/[...search]'>();
```

## 탭과 그룹

탭은 `(tabs)/_layout.tsx`에서 `Tabs`로 만든다. 화면은 `name`으로 파일을 가리킨다.

```tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: COLORS.focus.handleCore }}>
      <Tabs.Screen name="index" options={{ title: '타이머' }} />
      <Tabs.Screen name="settings" options={{ title: '설정' }} />
    </Tabs>
  );
}
```

루트 레이아웃은 탭 묶음을 화면 하나로 받는다.

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

`index.tsx`가 그 묶음의 기본 화면이다. 지금 `App.tsx`가 하는 일(`GestureHandlerRootView`, `SafeAreaProvider`, `StatusBar`)은 루트 `_layout.tsx`로 옮겨 간다.

## 이동과 Href

`Link`나 `router`로 이동한다. 동적 구간이 있으면 문자열을 이어 붙이지 말고 객체로 넘긴다.

```tsx
<Link href="/settings" />
<Link href={{ pathname: '/keycap/[mode]', params: { mode: 'focus' } }} />
```

```tsx
router.push({ pathname: '/keycap/[mode]', params: { mode } });
```

typedRoutes를 켜면 없는 경로와 잘못된 파라미터 키가 컴파일에서 걸린다. 이때 상대 경로는 지원되지 않으므로 절대 경로만 쓴다.

공용 컴포넌트가 특정 라우트의 파라미터를 가정하면 재사용이 깨진다. 그런 경우엔 `useLocalSearchParams`를 읽지 말고 props로 값을 받는다.

## 플랫폼 분기

`Platform.OS` 비교는 타입이 좁혀지므로 그냥 쓴다.

```ts
if (Platform.OS === 'ios') { /* ... */ }
```

값 분기는 `Platform.select`에 제네릭을 붙여 반환 타입을 고정한다.

```ts
const shadowStyle = Platform.select<ViewStyle>({
  ios: { shadowOpacity: 0.1, shadowRadius: 8 },
  android: { elevation: 4 },
  default: {},
});
```

`default`를 빠뜨리면 반환 타입에 `undefined`가 섞인다. 스타일 자리에 넣으면 통과하지만 값으로 쓸 거면 반드시 채운다.

**분기가 파일 전체에 퍼지면 파일을 나눈다.** 함수 하나에 `Platform.OS` 분기가 세 번 이상 나오면 `.ios.ts` / `.android.ts`로 쪼갤 신호다. 이때 Props나 함수 시그니처는 한 파일에서 공유한다.

```
liveActivity.ts          ← 시그니처 한 곳
liveActivity.ios.ts
liveActivity.android.ts
```

## 네이티브 모듈 타이핑

Expo 모듈(`requireNativeModule`)과 `NativeModules.X`는 타입 정보 없이 나온다. 인터페이스를 선언해 경계에서 한 번만 좁히고 그 뒤로는 타입이 붙은 상태로 흐르게 한다.

```ts
interface LiveActivityModule {
  start(endsAt: number): Promise<void>;
  stop(): Promise<void>;
}

export const LiveActivity = requireNativeModule<LiveActivityModule>('TadakLiveActivity');
```

`expo-modules-core`의 `requireNativeModule`은 제네릭을 받으므로 단언 없이 타입을 붙일 수 있다. `NativeModules`를 직접 쓸 때만 `as`가 필요하다.

이건 SKILL.md 2장의 단언 규칙을 깨는 허용된 예외다. 타입 정보가 애초에 없는 경계이기 때문이다. 다만:

- **선언한 시그니처가 실제 네이티브 구현과 맞는지는 아무도 검사하지 않는다.** 네이티브 코드를 고치면 이 파일도 같은 커밋에서 고친다.
- 웹이나 Expo Go처럼 모듈이 없을 수 있는 환경이면 `requireOptionalNativeModule<T>()`로 받는다. 없으면 `null`을 돌려주므로 래퍼를 따로 만들 필요가 없다.

이벤트를 받는 모듈이면 이벤트 이름과 페이로드도 타입으로 묶는다.

```ts
interface LiveActivityEventMap {
  stopped: { stoppedAt: number };
  error: { code: string; message: string };
}
```

## 자산 모듈 선언

`import icon from './icon.png'`처럼 ESM으로 가져오면 TS가 모듈을 찾지 못한다(`TS2307`). 선언 파일을 한 번 만들어둔다.

```ts
// types/assets.d.ts
declare module '*.png' {
  const content: number;
  export default content;
}
```

`require('./icon.png')`로 가져오면 반환이 `any`라 선언 없이도 통과한다. Expo가 선언해 주는 것은 `*.css`·`*.sass`·`*.scss`뿐이고(`expo/types/global.d.ts`) 이미지는 없다.

`require()`의 반환값은 문자열이 아니라 숫자 리소스 ID다. 이미지 prop은 `ImageSourcePropType`으로 받으면 `require()` 결과와 `{ uri }` 양쪽을 모두 허용한다.

```ts
interface IconProps {
  source: ImageSourcePropType;
}
```

`react-native-svg`로 SVG를 컴포넌트로 불러오는 설정이면 `*.svg` 선언은 `number`가 아니라 `React.FC<SvgProps>`가 된다. 프로젝트의 트랜스포머 설정에 맞춰 선언한다.
