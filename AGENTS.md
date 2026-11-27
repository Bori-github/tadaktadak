# Tadak 에이전트 지침

에이전트는 작업 전에 이 파일을 읽고 `DESIGN.md`, `SPEC.md`와 함께 따른다.

## 기술 스택

| 항목        | 값                        |
| ----------- | ------------------------- |
| 플랫폼      | iOS, Android              |
| 프레임워크  | React Native, Expo        |
| 번들 식별자 | `com.boriguri.tadaktadak` |

## 문서

| 파일                                     | 설명                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `DESIGN.md`                              | 화면에 보이는 것. 자형, 개체 규격, 시계판 좌표, 레이어, 반응형, 상태, 모션 |
| `SPEC.md`                                | 화면에 보이지 않는 동작. 시간 모델, 알림, Live Activity                    |
| `TESTS.md`                               | 배포 전 실기기 테스트. 플랫폼별 조작과 결과 확인 방법                      |
| 피그마 파일                              | 디자인 원본. 주소와 기준일은 `DESIGN.md` frontmatter                       |
| `.claude/docs/live-activity.md`          | 앱 상태에 따라 Live Activity가 어디까지 동작하는지. 조사 사실과 근거       |
| `.claude/docs/rendering-optimization.md` | 드래그 시 화면 반영 지연 문제와 원인, 해결, 측정 결과와 방법               |
| `.claude/docs/terms.md`                  | 용어 정리                                                                  |

- 보이는 값은 피그마를 원본으로 하고, 개발 과정에서 변경이 발생하면 피그마와 `DESIGN.md`를 함께 수정한다
- 피그마에 없는 배율, 반응형 구간, 겹침 검산, 상태, 모션은 `DESIGN.md`를 참고한다

## 규칙

`.claude/rules/` 아래 문서를 따른다.

- `.claude/rules/architecture/feature-sliced-design.md`
- `.claude/rules/workflow/dependency-updates.md`
- `.claude/rules/workflow/task-tracking.md`
- `.claude/rules/workflow/work-scope.md`

## 검증

- `pnpm check`: lint, typecheck, format:check
- `pnpm test`: Jest
- `pnpm storybook:dev`: 웹 스토리북 개발 서버(포트 6006)
- `pnpm build-storybook`: 웹 스토리북 정적 빌드
- `pnpm e2e:ios`: Maestro
- `pnpm e2e:android`: Maestro

## 작업 순서

- 디자인 결정을 변경할 때: 피그마와 `DESIGN.md` 중 한쪽을 수정하면 다른 쪽도 같은 작업에서 수정한다
- 색을 변경할 때
  - 피그마 변수를 수정하고, 같은 이름과 값을 `src/shared/constants/colorTokens.json`에 반영한다
  - 코드와 문서는 색 값 대신 변수 이름을 사용한다
- 상수를 변경할 때: `DESIGN.md`에서 그 값을 사용하는 표를 같은 커밋에서 수정한다. Layout 겹침 검산의 개체 중심 반지름 하한 표와 Responsive Behavior의 구간별 결과는 상수에서 파생된 값이므로 함께 수정한다
- 시계판에 개체를 추가할 때: `src/shared/lib/overlap.test.ts`의 원주 방향 검사에 새 개체의 쌍을 추가한다
- `src/shared/ui` 컴포넌트를 추가하거나 props를 변경할 때: 같은 폴더의 `*.stories.tsx`에 스토리를 추가하거나 수정한다

## 확인받을 것

- GitHub 계정명, 저작권자, 이메일 같은 신원 값은 확인받은 뒤 입력한다
- 완성 판정 기준은 확인받은 뒤 작성한다. 작성한 기준을 사용자 요구인 것처럼 인용하지 않는다
- 프로젝트 생성과 패키지 설치 전에 착수 여부를 확인한다
