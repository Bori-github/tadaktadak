# 렌더링 최적화

## 문제

손잡이를 드래그해 타이머 시간을 변경할 때 화면 반영이 지연된다.

- 측정 기기: iPhone 12 mini, Expo Go

## 원인

설정 시간이 1분 단위로 스냅될 때마다 `TimerScreen`이 리렌더링되고, 시계판 전체가 리렌더링 대상이 된다. 기준 화면 390×844, 모닥불 9 도트, 집중 25분·휴식 5분에서 렌더 트리의 Skia 노드 수는 아래와 같다.

| 요소                            | 노드     | 설정 시간이 바뀔 때 |
| ------------------------------- | -------- | ------------------- |
| 장작 48 + 모닥불 12 + 기준 표식 | 571      | 값이 동일하다       |
| 눈금 숫자 12개                  | 336      | 값이 동일하다       |
| 조작 버튼 둘                    | 130      | 값이 동일하다       |
| 타이머 숫자 둘                  | 136      | 값이 바뀐다         |
| 손잡이                          | 17       | 좌표가 바뀐다       |
| 호                              | 1 (경로) | 각도가 바뀐다       |

- 노드 1191개 중 1037개는 값이 동일한데도 리렌더링된다
- 60분을 한 바퀴 드래그하면 이 리렌더링이 60회 발생한다
- 노드 수는 그 요소가 그리는 도트 칸의 합이다. 칸 하나가 Skia `Rect` 하나다

## 해결

`DialItems`·`TickNumbers`·`Controls`를 `memo`로 감쌌다. 세 컴포넌트는 타이머 시간을 props로 받지 않으므로 리렌더링에서 제외된다.

| 상태    | 설정 시간 1회 변경당 리렌더링 노드 |
| ------- | ---------------------------------- |
| memo 전 | 1191                               |
| memo 후 | 154                                |

## 측정 결과

실기기에서 손잡이를 12시부터 시계 방향으로 한 바퀴 직접 드래그하고 React `Profiler`의 `actualDuration`을 측정했다.

| 상태    | 리렌더링당 평균 | 최대   | 16.7ms 초과  |
| ------- | --------------- | ------ | ------------ |
| memo 전 | 42.7ms          | 95.2ms | 45회 중 45회 |
| memo 후 | 8.8ms           | 25.3ms | 59회 중 2회  |

- 60Hz의 프레임 예산은 16.7ms다. 이를 초과한 리렌더링은 해당 프레임을 넘긴다. 적용 전에는 100%, 적용 후에는 3%다
- 한 바퀴에 리렌더링이 59회 발생한다. 1분 스냅이 중복 갱신을 만들지 않는다
- 초기 렌더는 81.4ms에서 78.7ms로 동일하다. `memo`는 리렌더링에만 적용된다

## 측정 방법

React `Profiler`의 `actualDuration`은 리렌더링 1회의 소요 시간을 반환한다.

1. 아래 코드를 `TimerScreen`에 임시로 추가한다
2. 12시부터 시계 방향으로 한 바퀴 드래그한다. 손을 뗀 뒤 0.5초가 지나면 해당 드래그의 측정값이 한 줄로 출력된다
3. 최적화를 적용한 상태와 제거한 상태를 각각 측정해 비교한다. 같은 기기에서 앱을 다시 실행하고 연속으로 측정해야 조건이 맞는다

```tsx
const FRAME_BUDGET_MS = 16.7;
/** 이 시간 동안 리렌더링이 없으면 드래그가 끝난 것으로 판정 */
const IDLE_MS = 500;
const samples: number[] = [];
let idle: ReturnType<typeof setTimeout> | undefined;

const flush = () => {
  if (samples.length === 0) return;

  const over = samples.filter((value) => value > FRAME_BUDGET_MS).length;
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const share = Math.round((over / samples.length) * 100);
  console.log(`[렌더] 갱신 ${samples.length}회 평균 ${average.toFixed(1)}ms 최대 ${Math.max(...samples).toFixed(1)}ms ${FRAME_BUDGET_MS}ms 초과 ${over}회 (${share}%)`);
  samples.length = 0;
};

const report = (duration: number) => {
  samples.push(duration);
  clearTimeout(idle);
  idle = setTimeout(flush, IDLE_MS);
};
```

```tsx
<Canvas style={StyleSheet.absoluteFill}>
  <Profiler id="dial" onRender={(_id, _phase, actualDuration) => report(actualDuration)}>
    {/* 시계판 */}
  </Profiler>
</Canvas>
```

측정 시 주의할 점

- `Profiler`는 `Canvas` 내부에 배치한다. Skia는 `Canvas`의 자식을 별도 루트에서 렌더링하므로, `Canvas` 바깥에 둔 `Profiler`에는 시계판 렌더링이 포함되지 않는다
- 시뮬레이터에서 측정을 먼저 시도했으나 시뮬레이터의 CPU 점유 때문에 값이 흔들려 실기기에서 측정했다
- 앱 실행 직후 출력되는 `갱신 1회`는 초기 렌더이므로 측정에서 제외한다

Expo Go는 개발 모드이므로 릴리스 빌드보다 느리다. 절대값이 아니라 적용 전후의 차이로 해석한다.

## 재검토 시점

- 시간 모델이 추가되면 장작·모닥불이 남은 시간을 props로 받는다. `DialItems`의 `memo`가 무효화되므로 Skia `Atlas`로 개체 60개를 단일 노드에 병합하는 방식을 검토한다
- 호와 손잡이를 공유 값으로 UI 스레드에서 처리하면 154개에서 타이머 숫자 136개만 남는다
