# 번역 리소스

로케일별 문구를 정의한다. 파일명은 `en-US`처럼 언어 코드와 지역 코드를 이은 IETF BCP 47 언어 태그이고, `src/shared/lib/localization.ts`가 i18next 리소스로 등록한다.

## 편집 규칙

값만 수정한다. 키 추가와 삭제는 호출부 변경을 동반하므로 코드와 함께 처리한다.

- 기본 로케일: `en-US.json`. 지원 목록에 없는 기기 언어는 이 파일로 폴백
- 키 누락은 `pnpm check`의 타입 검사가 검출하고, 빈 문자열은 검출하지 않음

## 앱 이름

`app.name`을 수정할 때 다음 표의 파일을 함께 수정한다.

| 파일                                     | 키                                                        |
| ---------------------------------------- | --------------------------------------------------------- |
| `app.json`                               | `expo.name`. 지원 목록에 없는 기기 언어가 사용하는 기준값 |
| `languages/ko.json`                      | `ios.CFBundleDisplayName`, `android.app_name`             |
| `en-US.json`, `ko-KR.json`               | `app.name`. 알림 제목                                     |
| `targets/widget/Localizable.xcstrings`   | Live Activity 잠금화면                                    |
| `targets/widget/TimerLiveActivity.swift` | `Text` 리터럴. `Localizable.xcstrings`의 키               |
