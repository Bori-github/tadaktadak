# Feature-Sliced Design (FSD)

공식 문서: https://feature-sliced.design/docs/get-started/overview

Feature-Sliced Design(FSD) 은 프론트엔드 애플리케이션의 구조를 잡기 위한 아키텍처 방법론이다. 이 방법론의 핵심 목적은 끊임없이 변하는 비즈니스 요구사항 속에서도 프로젝트를 이해하기 쉽고 안정적으로 유지하는 것이다.

흔한 실패는 규칙 위반이 아니라 과잉 분해다. 먼저 `screens`에 두고, 재사용 범위가 넓어지면 하위 레이어로 내린다.

## 핵심 모델

FSD는 애플리케이션을 세 개의 축으로 분해한다.

1. 레이어(Layers) — 책임의 범위 (고정된 어휘, 엄격한 순서)
2. 슬라이스(Slices) — 레이어 내부의 비즈니스 도메인 단위 묶음
3. 세그먼트(Segments) — 슬라이스 내부의 기술적 목적 단위 묶음

### Layers

레이어는 책임 범위가 넓은 것에서 좁은 것 순으로 정렬된다. import 방향은 엄격하게 위에서 아래로만 흐른다. 모듈은 자신보다 아래 레이어에서만 import할 수 있으며, 같은 레이어끼리도, 위 레이어로도 참조할 수 없다.

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
───────────────────────────────────────────────────────────────→
                    엄격한 import 방향 (위 → 아래)
```

`pages` 레이어만 폴더 이름을 `screens`로 쓴다.

| 레이어      | 슬라이스 | 책임                                                                                              |
| ----------- | -------- | ------------------------------------------------------------------------------------------------- |
| `app/`      | 없음     | 라우팅, 프로바이더, 전역 스타일, 진입점, 스토어 설정                                              |
| `screens/`  | 있음     | 화면 또는 라우트 전체                                                                             |
| `widgets/`  | 있음     | entities와 features를 조합해 의미 있는 독립적인 UI 블록                                           |
| `features/` | 있음     | 비즈니스 가치를 만들어내는 사용자 행동 (동사: "댓글 보내기", "장바구니 담기", "결과 필터링") 기능 |
| `entities/` | 있음     | 프로젝트가 다루는 비즈니스 도메인 객체 (명사: user, product, order, notification)                 |
| `shared/`   | 없음     | 비즈니스 맥락에서 분리된 재사용 코드                                                              |

### Segments

각 슬라이스 안에서 기술적 목적에 따라 나눈다.

| 세그먼트 | 목적                                       |
| -------- | ------------------------------------------ |
| `ui`     | 컴포넌트, 스타일                           |
| `api`    | 서버 요청, 요청/응답 타입, 매핑            |
| `model`  | 데이터 스키마, 스토어, 비즈니스 로직, 검증 |
| `lib`    | 이 슬라이스에서 필요한 유틸리티 코드       |
| `config` | 상수, 환경값, 피처 플래그                  |

세그먼트 이름 규칙

- 본질이 아니라 목적을 나타낸다.
- 금지되는 세그먼트 폴더명: components, hooks, utils, helpers, containers, types
- 올바른 세그먼트 폴더명: ui, model, api, lib, config
- 세그먼트 안의 파일은 이름을 자유롭게 지어도 된다. model/types.ts, model/store.ts, model/validation.ts 모두 유효하다.

## Public API

모든 슬라이스는 루트의 `index.ts` 하나를 통해 내보낸다. 슬라이스 외부에서 사용 가능한 import 경로는 이것뿐이다.

- 명시적 named export만 사용한다 — 각 export는 이름과 출처를 개별적으로 밝힌다
- 와일드카드 re-export를 금지한다 (export * from ... 사용 불가)
- 슬라이스 내부 파일 간 참조는 상대 경로를 사용한다. (자기 슬라이스의 index를 참조하지 않는다)
- 슬라이스 간 참조는 별칭 기반 절대 경로를 사용한다. (예: @/entities/user)
- 슬라이스의 public API는 `index.ts` 하나로 충분하다. `widgets/dial/ui/index.ts` 같은 중첩 배럴은 만들지 않는다.
- `shared`는 예외다. 슬라이스가 없으므로 세그먼트와 컴포넌트 단위로 index 파일을 둔다.

```
shared/ui/dot-number/index.ts
shared/ui/dot-sprite/index.ts
```

## 규칙과 강제

| 규칙                                                  | 강제                            |
| ----------------------------------------------------- | ------------------------------- |
| 위 레이어만 아래 레이어를 import한다                  | `fsd/forbidden-imports`         |
| 같은 레이어의 다른 슬라이스를 import하지 않는다       | `fsd/no-cross-slice-dependency` |
| 슬라이스와 세그먼트는 public API(`index.ts`)로만 연다 | `fsd/no-public-api-sidestep`    |
| 레이어를 넘는 import는 `@/` 별칭을 쓴다               | `fsd/no-relative-imports`       |
| import는 레이어 순서대로 묶는다                       | `fsd/ordered-imports`           |
| 레이어 폴더 밖에 파일을 두지 않는다                   | `boundaries/no-unknown-files`   |
| 슬라이스 안을 세그먼트로 나눈다                       | `boundaries/no-unknown-files`   |

`pnpm lint`가 돌린다. 설정은 `eslint.config.js`에 있다.
