---
name: code-quality
description: Frontend Fundamentals의 좋은 코드 4가지 기준(가독성, 예측 가능성, 응집도, 결합도)으로 코드를 작성하고 점검하는 스킬. .ts/.tsx 파일을 새로 만들거나 수정할 때, 함수·컴포넌트·훅을 나누거나 합칠 때, 조건식·상수에 이름을 붙일 때, 공통화 여부를 판단할 때, 코드 리뷰나 리팩터링을 할 때 반드시 이 스킬을 사용할 것. 사용자가 "리팩터링해줘", "코드 리뷰해줘", "이거 나눠줘", "훅으로 빼줘", "공통으로 빼줘", "읽기 어렵다"라고 하거나, 코드 품질을 명시적으로 언급하지 않아도 TypeScript 코드를 생성·수정하는 상황이면 적용할 것.
---

# 코드 품질 4가지 기준

출처: https://frontend-fundamentals.com/code-quality/code/

좋은 코드는 변경하기 쉬운 코드다. 네 기준으로 판단한다.

| 기준        | 확인하는 것                                       |
| ----------- | ------------------------------------------------- |
| 가독성      | 한 번에 고려할 맥락이 적고 위에서 아래로 읽히는가 |
| 예측 가능성 | 이름, 파라미터, 반환값만 보고 동작을 알 수 있는가 |
| 응집도      | 함께 수정해야 하는 코드가 항상 함께 수정되는가    |
| 결합도      | 코드를 수정했을 때 영향 범위가 좁은가             |

## 기준이 충돌할 때

네 기준을 동시에 충족하기는 어렵다. 가독성과 응집도가 충돌하면 이렇게 선택한다.

- 함께 수정하지 않으면 오류가 나는 코드는 응집도를 우선해 공통화하고 추상화한다
- 그 위험이 낮으면 가독성을 우선해 중복을 허용한다

## 여기서 다루지 않는 것

| 무엇                   | 맡는 곳                                               |
| ---------------------- | ----------------------------------------------------- |
| 이름의 형태, 타입 설계 | `typescript-style-guide` 스킬                         |
| 레이어·슬라이스 배치   | `.claude/rules/architecture/feature-sliced-design.md` |
| 중첩 삼항 연산자       | `no-nested-ternary`                                   |
| 주석·문서 문구         | `ko-dev-doc` 스킬                                     |

## 작업 순서

1. 함수·컴포넌트·훅을 만들거나 수정할 때 1~4장의 항목을 장 순서로 확인한다
2. 기준끼리 충돌하면 「기준이 충돌할 때」로 선택한다
3. 마지막에 `pnpm check`를 실행한다

---

## 1. 가독성

### 맥락 줄이기

**같이 실행되지 않는 코드를 분리한다.** 권한이나 상태에 따라 동시에 실행되지 않는 분기가 한 컴포넌트에 섞여 있으면 분기별 컴포넌트로 나눈다.

```tsx
// 이러지 않는다
export const SubmitButton = (): JSX.Element => {
  const isViewer = useRole() === 'viewer';

  useEffect(() => {
    if (isViewer) return;
    showButtonAnimation();
  }, [isViewer]);

  return isViewer ? <TextButton disabled>Submit</TextButton> : <Button>Submit</Button>;
};

// 이렇게
export const SubmitButton = (): JSX.Element => {
  const isViewer = useRole() === 'viewer';

  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />;
};
```

**구현 상세를 추상화한다.** 로그인 확인 뒤 이동, 확인 다이얼로그 뒤 전송 같은 절차가 화면 컴포넌트에 그대로 드러나 있으면 그 절차를 담당하는 컴포넌트로 옮긴다. 버튼과 그 버튼의 핸들러 로직은 한 컴포넌트에 둔다.

**로직 종류로 묶은 함수를 분리한다.** 「쿼리 파라미터 전부」처럼 종류로 묶은 훅은 값 하나를 관리하는 훅으로 나눈다. 묶어 두면 새 값이 그 훅에 계속 추가되고, 값 하나만 읽는 컴포넌트도 다른 값이 변경될 때 리렌더링된다.

### 이름 붙이기

**복잡한 조건에 이름을 붙인다.**

```ts
// 이러지 않는다
const result = products.filter((product) => product.categories.some((category) => category.id === targetCategory.id && product.prices.some((price) => minPrice <= price && price <= maxPrice)));

// 이렇게
const matchedProducts = products.filter((product) =>
  product.categories.some((category) => {
    const isSameCategory = category.id === targetCategory.id;
    const isPriceInRange = product.prices.some((price) => minPrice <= price && price <= maxPrice);

    return isSameCategory && isPriceInRange;
  }),
);
```

| 이름을 붙인다                | 붙이지 않는다           |
| ---------------------------- | ----------------------- |
| 로직이 여러 줄에 걸친다      | 로직이 간단하다         |
| 같은 로직을 여러 곳에서 쓴다 | 코드에서 한 번만 쓰인다 |
| 단위 테스트가 필요하다       |                         |

**매직 넘버에 이름을 붙인다.** `delay(300)`의 `300`은 맥락을 알 수 없다. `ANIMATION_DELAY_MS`처럼 단위까지 담은 상수로 선언한다. 여백, 좌표, 글자 크기 같은 스타일 값은 예외로 쓰는 자리에 둔다.

### 위에서 아래로 읽히게 하기

**시점 이동을 줄인다.** 값 하나를 이해하려고 다른 함수와 다른 파일을 순서대로 참조해야 하면, 조건을 쓰는 자리에서 한눈에 보이게 옮긴다.

```tsx
// 이러지 않는다. `getPolicyByRole`과 `POLICY_SET`을 순서대로 참조해야 한다
const policy = getPolicyByRole(user.role);

// 이렇게
const policy = {
  admin: { canInvite: true, canView: true },
  viewer: { canInvite: false, canView: true },
}[user.role];
```

**삼항 연산자를 단순하게 한다.** 중첩하지 않고 `if` 문으로 바꾼다. `no-nested-ternary`가 강제한다.

```ts
const status = (() => {
  if (isA && isB) return 'BOTH';
  if (isA) return 'A';
  if (isB) return 'B';

  return 'NONE';
})();
```

**왼쪽에서 오른쪽으로 읽히게 한다.** 범위 조건은 부등식 `b ≤ a ≤ c`와 같은 순서로 쓴다. `score >= 80 && score <= 100`이 아니라 `80 <= score && score <= 100`이다.

---

## 2. 예측 가능성

**이름이 겹치지 않게 한다.** 같은 이름은 같은 동작을 해야 한다. 라이브러리의 `http.get`에 토큰 주입을 추가한 모듈을 다시 `http.get`으로 내보내지 않고 `httpService.getWithAuth`처럼 추가한 동작을 이름에 적는다.

**같은 종류의 함수는 반환 타입을 통일한다.** API 훅 하나가 Query 객체를 반환하면 나머지 API 훅도 Query 객체를 반환한다. 검증 함수는 전부 `{ ok: true } | { ok: false; reason: string }` 같은 판별 유니온 하나를 반환한다. `boolean`과 객체가 섞이면 객체를 반환하는 쪽의 `if (checkIsAgeValid(age))`가 항상 참이 된다.

**숨은 로직을 드러낸다.** 이름, 파라미터, 반환 타입에 드러나지 않는 동작은 함수 밖으로 분리해 호출하는 자리에 적는다.

```ts
// 이러지 않는다. `fetchBalance`라는 이름에서 로깅을 알 수 없다
const fetchBalance = async (): Promise<number> => {
  const balance = await http.get<number>('...');
  logging.log('balance_fetched');

  return balance;
};

// 이렇게
const balance = await fetchBalance();
logging.log('balance_fetched');
```

---

## 3. 응집도

**함께 수정되는 파일을 같은 디렉터리에 둔다.** 종류(`components`, `hooks`, `utils`)가 아니라 함께 수정되는 단위로 묶는다. 기능을 삭제할 때 디렉터리 하나만 삭제하면 되어야 한다. 이 저장소에서는 Feature-Sliced Design의 슬라이스가 그 단위다.

**매직 넘버를 없앤다.** 같은 숫자가 다른 코드와 함께 변경되어야 하면 상수 하나로 선언해 양쪽에서 읽는다. 애니메이션 시간과 그 뒤의 지연 시간을 각자 `300`으로 적으면 한쪽만 변경되어 두 값이 달라진다.

**폼은 변경 단위에 맞춰 묶는다.**

| 필드 단위로 묶는다               | 폼 전체 단위로 묶는다                       |
| -------------------------------- | ------------------------------------------- |
| 필드마다 비동기 검증이 필요하다  | 모든 필드가 기능 하나를 이룬다              |
| 필드와 검증을 다른 폼에서도 쓴다 | 단계별로 나뉜 폼이다                        |
|                                  | 필드끼리 의존한다(비밀번호 확인, 총액 계산) |

---

## 4. 결합도

**책임을 하나씩 관리한다.** 페이지의 모든 값을 관리하는 훅에는 여러 컴포넌트가 의존하게 되고, 그 훅을 수정하면 전부 영향을 받는다. 값 하나를 관리하는 훅으로 나눠 영향 범위를 좁힌다.

**중복 코드를 허용한다.** 공통화하면 그 코드를 쓰는 모든 자리가 결합된다.

| 공통화한다                                       | 중복으로 둔다                      |
| ------------------------------------------------ | ---------------------------------- |
| 자리마다 동작이 같고 앞으로도 달라질 여지가 없다 | 자리마다 동작이 달라질 여지가 있다 |

**Props Drilling을 제거한다.** 중간 컴포넌트가 쓰지 않는 값을 하위 컴포넌트로 전달만 하면 이 순서로 해결한다.

1. 컴포넌트의 역할을 나타내는 prop이면 그대로 둔다
2. `children`으로 조합해 중간 컴포넌트를 거치지 않게 한다
3. 1과 2로 해결되지 않을 때만 Context를 쓴다

---

## 감사

기존 코드를 점검할 때 순서다.

1. `pnpm check`를 먼저 실행한다. `no-nested-ternary`처럼 도구가 잡는 것은 결과를 그대로 보고한다
2. 남은 항목을 이 문서의 장 순서대로 점검한다
3. 위반마다 `파일:줄`과 어느 항목인지 적는다. 고칠 안을 함께 낸다
4. 고칠 때는 기능 변경과 섞지 않는다. `refactor`로 분리하고 커밋 200줄·8파일 상한을 지킨다
