# 컴포넌트와 스타일 심화

SKILL.md 3장의 기본 패턴으로 안 되는 경우를 다룬다.

## 목차

1. [제네릭 컴포넌트](#제네릭-컴포넌트)
2. [Context 타이핑](#context-타이핑)
3. [ref와 imperative handle](#ref와-imperative-handle)
4. [children 타입 고르기](#children-타입-고르기)
5. [판별 유니온 Props](#판별-유니온-props)
6. [스타일 조합 패턴](#스타일-조합-패턴)
7. [애니메이션 타이핑](#애니메이션-타이핑)

---

## 제네릭 컴포넌트

아이템 타입이 호출부마다 다른 컴포넌트는 제네릭으로 만든다. `React.FC`로는 표현이 안 되므로 화살표 표현식에 타입 파라미터를 붙인다. `.tsx`에서 타입 파라미터가 홀로 있으면 JSX 태그와 구분되지 않아 `<TItem,>`처럼 쉼표가 필요하다.

```tsx
interface SelectListProps<TItem> {
  items: readonly TItem[];
  getKey: (item: TItem) => string;
  renderItem: (item: TItem) => React.ReactNode;
  onSelect: (item: TItem) => void;
}

export const SelectList = <TItem,>({ items, getKey, renderItem, onSelect }: SelectListProps<TItem>) => {
  return (
    <View>
      {items.map((item) => (
        <Pressable key={getKey(item)} onPress={() => onSelect(item)}>
          {renderItem(item)}
        </Pressable>
      ))}
    </View>
  );
};
```

`FlatList`를 감쌀 땐 원본 props를 확장하고 바꾸는 것만 덮어쓴다.

```tsx
interface PresetListProps<TItem> extends Omit<FlatListProps<TItem>, 'renderItem'> {
  renderRow: ListRenderItem<TItem>;
}
```

`keyof` 제약으로 잘못된 키 전달을 막을 수 있다.

```tsx
interface SortableListProps<TItem, TKey extends keyof TItem> {
  items: readonly TItem[];
  sortBy: TKey;
}
```

## Context 타이핑

기본값을 `null`로 두고 커스텀 훅에서 검사한 뒤 내보낸다. 소비하는 쪽에서 null 체크를 반복할 필요가 없다.

```tsx
interface TimerContextValue {
  mode: TimerMode;
  select: (mode: TimerMode) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const useTimerContext = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (context === null) {
    throw new Error('useTimerContext는 TimerProvider 안에서만 사용할 수 있습니다');
  }
  return context;
};
```

기본값에 가짜 객체(`{} as TimerContextValue`)를 넣으면 Provider를 빠뜨렸을 때 런타임에 조용히 undefined가 흘러간다. Context는 SKILL.md 2장의 단언 규칙이 특히 중요한 자리다.

Context에 담은 값은 JS 스레드에만 있다. worklet이 읽어야 하면 Context가 아니라 공유 값으로 넘긴다.

## ref와 imperative handle

React 19(RN 0.78+)부터 `ref`는 일반 prop이다.

```tsx
interface PanelProps extends ViewProps {
  ref?: React.Ref<View>;
}
```

내부 메서드만 골라 노출할 땐 핸들 타입을 함께 정의하고 export 한다. 소비하는 쪽이 `useRef<BottomSheetHandle>(null)`로 받을 수 있어야 한다.

```tsx
export interface BottomSheetHandle {
  open: () => void;
  close: () => void;
}

useImperativeHandle(ref, () => ({ open, close }), [open, close]);
```

가변 값 저장용 ref는 초기값을 명시한다. `setTimeout` 반환 타입은 환경마다 다르므로 `ReturnType`으로 받는다.

```ts
const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
```

`ref.current`는 렌더 중에 읽지 않는다. 이벤트 핸들러나 effect 안에서만 만진다. `react-hooks/refs`가 렌더 중 접근을 막는다.

worklet이 읽어야 하는 값은 `useRef`가 아니라 `useSharedValue`다.

## children 타입 고르기

| 타입                            | 허용 범위                          | 쓰는 경우                        |
| ------------------------------- | ---------------------------------- | -------------------------------- |
| `React.ReactNode`               | 엘리먼트, 문자열, 숫자, 배열, null | 기본값                           |
| `React.ReactElement`            | 엘리먼트만                         | `cloneElement`로 props 주입할 때 |
| `(value: T) => React.ReactNode` | 함수                               | render prop                      |

RN에는 **문자열 children이 반드시 `<Text>` 안에 있어야 한다**는 런타임 제약이 있는데 타입으로는 잡히지 않는다. 문자열만 받는 컴포넌트라면 `children: string`으로 좁혀두면 내부에서 `<Text>`로 감싼다는 계약이 드러난다.

## 판별 유니온 Props

props 조합에 규칙이 있으면 유니온으로 표현한다.

```tsx
type ControlButtonProps =
  | { state: 'enabled'; onPress: () => void; disabledReason?: never }
  | { state: 'disabled'; disabledReason: string; onPress?: never };
```

`onPress?: never`를 넣는 이유는 초과 프로퍼티 검사가 유니온에서 느슨하게 동작하기 때문이다. 이걸 빼면 두 필드를 동시에 넘겨도 통과한다.

## 스타일 조합 패턴

**variant 매핑은 룩업 객체로.** 조건문을 늘어놓는 것보다 키 누락이 타입으로 잡힌다.

```ts
const MODE_STYLE: Record<TimerMode, ViewStyle> = {
  focus: { backgroundColor: COLORS.focus.handleCore },
  rest: { backgroundColor: COLORS.rest.handleCore },
};
```

`Record<TimerMode, ViewStyle>`로 선언했으므로 모드를 추가하면 여기서 컴파일 에러가 난다.

**StyleSheet.create 밖의 스타일 객체는 타입을 명시한다.** 안 그러면 문자열 리터럴 속성이 넓어진다.

```ts
// 나쁨: fontWeight가 string으로 추론돼 TextStyle에 못 들어감
const titleStyle = { fontSize: 18, fontWeight: '600' };

// 좋음
const titleStyle: TextStyle = { fontSize: 18, fontWeight: '600' };
```

**스타일 배열을 prop으로 흘릴 땐 `StyleProp`을 유지한다.** 중간에서 `ViewStyle`로 좁히면 배열이 막힌다.

```tsx
const Panel = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[styles.root, style]} />;
```

## 애니메이션 타이핑

내장 `Animated` 대신 `react-native-reanimated`를 쓴다.

`useSharedValue`는 초기값에서 추론되지만 null이나 빈 배열이면 명시한다.

```ts
const dragged = useSharedValue(minutes);
const grabbed = useSharedValue(false);
const positions = useSharedValue<number[]>([]);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: dragged.value }],
}));
```

제스처 콜백의 인자 타입은 `Gesture.Pan()` 쪽이 이미 알고 있다. 직접 적지 않고 추론에 맡긴다.

worklet 안에서 shared value가 아닌 외부 변수를 참조하면 클로저 복사본이 잡혀 런타임에 값이 갱신되지 않는다. `tsc`도 `eslint`도 잡지 못하므로, worklet이 읽는 값이 전부 `useSharedValue`인지 직접 확인한다.
