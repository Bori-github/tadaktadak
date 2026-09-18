---
name: pr
description: 타닥타닥 저장소에 Pull Request를 만들 때 쓴다. 사용자가 "PR", "PR 올려줘", "PR 만들어줘", "풀리퀘스트", "풀 리퀘스트", "풀리퀘스트 작성", "풀리퀘"라고 하면 이 스킬을 쓴다.
---

# Pull Request

현재 브랜치의 변경으로 Pull Request를 만든다. 규칙의 단일 출처는 아래이며, 이 스킬은 그것을 실행할 뿐 규칙을 다시 정의하지 않는다.

- 제목 형식: `.claude/skills/commit/SKILL.md`
- 본문 구조: `.github/pull_request_template.md`

## 절차

1. **base 결정** — 인자로 받은 브랜치, 없으면 `main`. `origin/<base>`가 있으면 그것을 기준으로 삼는다. 현재 브랜치가 base면 만들 변경이 없다고 알리고 멈춘다.

2. **맥락 수집**
   - `git log origin/<base>..HEAD --oneline` — 커밋들이 곧 의도다
   - `git diff origin/<base>..HEAD --stat` — 변경 파일
   - `DESIGN.md`·`SPEC.md`·`PLAN.md`·`.claude` 변경에서 결정과 이탈을 읽는다

3. **크기 확인** — `sh .lefthook/check-work-scope.sh push`. 목표 400줄을 넘으면 PR을 만들기 전에 나눌 방법을 제안한다(예: 설정·리팩터 같은 준비 변경을 선행 PR로 먼저 낸다). 상한 600줄은 pre-push가 막는다. 규칙은 `.claude/rules/workflow/work-scope.md`.

4. **명세 대조** — 기계가 보지 못하는 것을 코드와 대조한다. 어긋나면 PR을 만들기 전에 알린다.
   - 상수를 바꿨으면 `DESIGN.md`에서 그 값을 쓰는 표가 함께 고쳐졌는가. §5 겹침 검산과 §7 구간별 처리는 상수에서 파생된 값이다
   - 시계판에 개체를 더했으면 겹침 검산을 다시 돌렸는가

5. **본문 작성** — 템플릿을 읽어 각 절을 diff·커밋을 근거로 채운다.
   - 범위의 "의도적으로 하지 않은 것"과 검증(값)은 **반드시** 채운다 — diff에 담기지 않는 정보다
   - 확실치 않으면 추측하지 말고 사용자에게 묻는다
   - diff·커밋·문서에서 읽을 수 있는 것은 되풀이하지 않는다
   - 쓸 내용이 없는 절은 비워 둔다. 채우려고 만들어 내지 않는다
   - 대화에서 오간 검토 과정과 후보 비교를 옮기지 않는다

6. **다이어그램(mermaid)** — 다음 중 하나가 변경에 들어 있으면 넣는다. 없으면 넣지 않는다. 그림을 위한 그림은 노이즈다.
   - **상태 기계** — 전이가 셋 이상이고 잘못된 전이가 버그가 되는 것(예: 모드와 단계의 조합, `DESIGN.md` §8) → `stateDiagram-v2`
   - **여러 층을 가로지르는 흐름** — 앱·Live Activity·App Intent를 관통하는 경로(예: 정지 버튼) → `sequenceDiagram`
   - **순서가 곧 규칙인 계산** — (예: `DESIGN.md` §7 계산 순서) → `flowchart`
   - **원칙**: `DESIGN.md`·`SPEC.md`에 이미 그림이 있으면 링크하고, 리뷰어가 diff 전에 방향을 잡을 핵심 하나만 인라인한다
   - **넣지 않는 것**: 레이어 구조도(`.claude/rules`에 이미 있다), 파일 나열형 그림 — diff와 겹친다

7. **제목** — 지배적 변경으로 type을 정한다. 형식은 커밋 스킬을 따른다.

8. **라벨** — 변경 유형에 맞는 라벨을 고른다.

9. **검증 상태** — 실기기에서 무엇을 확인했는지 사용자에게 묻고 값으로 적는다. 추측해서 채우지 않는다. Live Activity와 진동, 알림은 시뮬레이터에서 확인되지 않는다.

10. **녹화 (화면에 보이는 것이 바뀐 PR이면 첨부)** — 문서·리팩터링·설정만 바뀐 PR은 건너뛴다.

```sh
.claude/skills/pr/scripts/record-demo.sh demo.mp4        # 실기기 녹화
.claude/skills/pr/scripts/upload-attachment.sh demo.mp4  # 주소를 받는다
```

- 받은 주소를 본문의 "스크린샷 / 데모" 절에 그대로 넣는다. 영상은 GitHub이 재생기로 그린다
- 한번 올린 파일은 CDN에서 지울 수 없다. 화면에 다른 것이 비쳤는지 먼저 본다

11. **확인 후 생성** — 초안(제목·본문·라벨·녹화)을 보여 주고 **승인받은 뒤에만** 실행한다.
    - 브랜치가 원격에 없으면 먼저 `git push -u origin <branch>` (승인 후)
    - `gh pr create --base <base> --title "…" --body "…" --assignee @me`
    - `gh pr edit --add-label <label>`
    - 담당자는 `@me`(현재 인증 사용자)로 배정한다. 계정명을 하드코딩하지 않는다

## 규칙

- push, PR 생성, 라벨 부여 같은 외부 작업은 반드시 먼저 확인받는다. 승인 전에는 실행하지 않는다
- 저장소 식별자(GitHub 계정·주소)를 본문에 하드코딩하지 않는다
