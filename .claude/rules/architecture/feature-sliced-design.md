# 아키텍처

FSD(Feature-Sliced Design)를 적용한다. 레이어 순서는 이렇다.

```
app → pages → widgets → features → entities → shared
```

`pages` 레이어만 폴더 이름을 `screens`로 쓴다. `eslint.config.js`에서 매핑한다.

## 규칙과 강제

| 규칙                                                  | 강제                            |
| ----------------------------------------------------- | ------------------------------- |
| 위 레이어만 아래 레이어를 import한다                  | `fsd/forbidden-imports`         |
| 같은 레이어의 다른 슬라이스를 import하지 않는다       | `fsd/no-cross-slice-dependency` |
| 슬라이스와 세그먼트는 public API(`index.ts`)로만 연다 | `fsd/no-public-api-sidestep`    |
| 레이어를 넘는 import는 `@/` 별칭을 쓴다               | `fsd/no-relative-imports`       |
| import는 레이어 순서대로 묶는다                       | `fsd/ordered-imports`           |
| 레이어 폴더 밖에 파일을 두지 않는다                   | 없음. 사람이 지킨다             |

`pnpm lint`가 돌린다. 설정은 `eslint.config.js`에 있다.

```ts
import { COLORS } from '@/shared/constants'; // 다른 레이어 — 별칭
import { TimerCanvas } from './TimerCanvas'; // 같은 슬라이스 — 상대 경로
```
