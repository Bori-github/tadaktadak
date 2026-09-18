# Tadak 에이전트 지침

에이전트는 작업 전에 이 파일을 읽고 `DESIGN.md`, `SPEC.md`, `PLAN.md`와 함께 따른다.

## 기술 스택

| 항목        | 값                        |
| ----------- | ------------------------- |
| 플랫폼      | iOS, Android              |
| 프레임워크  | React Native, Expo        |
| 번들 식별자 | `com.boriguri.tadaktadak` |

## 문서

| 파일                                     | 설명                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `DESIGN.md`                              | 화면에 보이는 것. 팔레트, 자형, 개체 규격, 시계판 좌표, 레이어, 반응형, 상태, 모션 |
| `SPEC.md`                                | 화면에 보이지 않는 동작. 시간 모델, 알림, Live Activity                            |
| `PLAN.md`                                | 만드는 과정. 작업 단계, 확인할 것, 개발 환경                                       |
| 피그마 파일                              | 디자인 원본. 주소와 기준일은 `DESIGN.md` frontmatter                               |
| `.claude/docs/live-activity.md`          | 앱 상태에 따라 Live Activity가 어디까지 동작하는지. 조사 사실과 근거               |
| `.claude/docs/rendering-optimization.md` | 드래그 시 화면 반영 지연 문제와 원인, 해결, 측정 결과와 방법                       |
| `.claude/docs/terms.md`                  | 용어 정리                                                                          |

- 보이는 값은 피그마를 원본으로 하고, 개발 과정에서 변경이 생기면 피그마와 `DESIGN.md`를 함께 고친다
- 피그마에 없는 배율, 반응형 구간, 겹침 검산은 `DESIGN.md`를 참고한다

## 규칙

`.claude/rules/` 아래 문서를 따른다.

- `.claude/rules/architecture/feature-sliced-design.md`
- `.claude/rules/workflow/work-scope.md`

## 작업 순서

- 디자인 결정을 바꿀 때: 피그마와 `DESIGN.md` 중 한쪽을 고치면 다른 쪽도 같은 작업에서 맞춘다
- 상수를 바꿀 때: `DESIGN.md`에서 그 값을 쓰는 표를 같은 커밋에서 고친다. Layout의 겹침 검산과 Responsive Behavior의 구간별 결과는 상수에서 파생된 값이라 함께 틀어진다
- 시계판에 개체를 추가할 때: 먼저 `DESIGN.md` Layout의 겹침 검산을 다시 돌린다. 모닥불과 장작 사이 여유가 한 도트 남짓이라 개체 하나로 무너진다

## 확인받을 것

- GitHub 계정명, 저작권자, 이메일 같은 신원 값은 확인받고 채운다
- 완성 판정 기준은 확인받고 만든다. 만든 기준을 사용자 요구인 것처럼 인용하지 않는다
- 프로젝트 생성과 패키지 설치 전에 착수 여부를 확인한다
