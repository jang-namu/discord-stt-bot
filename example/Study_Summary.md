# GDG Backend Book Club: Object Study Week 1-2

## 1. Study Overview

- 일시: 2025.02.16
- 범위: 오브젝트 1-2장
- 중점 주제: 객체지향 설계의 기본 원리와 책임 주도 설계

### Key Focus Areas

- 티켓 판매 시스템을 통한 절차지향에서 객체지향으로의 전환 과정
- 영화 예매 시스템 설계를 통한 할인 정책과 할인 조건의 구현
- 상속과 합성의 트레이드오프

## 2. Key Discussions

### Discussion Point: 도메인 설계에서 생성 시점 제약사항 처리

### Context & Background

객체의 생성 시점에 도메인 제약사항을 어떻게 강제할 것인가에 대한 논의가 있었습니다. 특히 Bag 객체의 제약사항을 예시로 들며, 생성자를 통한 제약과 다른 방식들의 장단점을 토론했습니다.

### Technical Deep Dive

```java
public class Bag {
    private Invitation invitation;
    private Ticket ticket;
    private Long amount;

    // 생성자를 통한 제약사항 강제
    public Bag(Invitation invitation, Ticket ticket, Long amount) {
        this.invitation = invitation;
        this.ticket = ticket;
        this.amount = amount;
    }
}

```

참가자들은 실제 로또 도메인을 예시로 들며 논의를 확장했습니다:

```java
public class LottoNumber {
    private final int number;

    public LottoNumber(int number) {
        validateRange(number);
        this.number = number;
    }

    private void validateRange(int number) {
        if (number < 1 || number > 45) {
            throw new IllegalArgumentException("로또 번호는 1-45 사이여야 합니다");
        }
    }
}

```

### Conclusions

- 도메인 제약사항은 가능한 한 객체 생성 시점에 강제하는 것이 안전하다
- 생성자를 통한 제약은 컴파일 타임에 오류를 잡을 수 있는 장점이 있다
- Validation 로직은 해당 도메인 객체가 책임져야 한다

### Discussion Point: 상속 vs 합성 선택의 기준

### Various Perspectives

참가자들은 실제 프로젝트에서 마주한 경험을 공유하며 다음과 같은 관점들을 제시했습니다:

1. 코드 재사용 관점

```java
// 상속을 통한 구현
public class AmountDiscountPolicy extends DiscountPolicy {
    @Override
    protected Money getDiscountAmount(Screening screening) {
        return Money.wons(800);
    }
}

// 합성을 통한 구현
public class Movie {
    private DiscountPolicy discountPolicy;

    public Money calculateMovieFee(Screening screening) {
        return discountPolicy.calculateDiscountAmount(screening);
    }
}

```

1. 확장성 관점
- 상속은 컴파일 시점에 결정되어 유연성이 떨어진다
- 합성은 런타임에 교체 가능해 더 유연한 설계가 가능하다

### Technical Deep Dive

특히 합성을 사용할 때의 "조합 폭발" 문제 해결에 대해 심도있는 논의가 있었습니다:

```java
// 상속을 사용할 경우 발생하는 조합 폭발
public class SlackDiscordNotifier extends Notifier { ... }
public class SlackKakaoNotifier extends Notifier { ... }
public class DiscordKakaoNotifier extends Notifier { ... }
public class SlackDiscordKakaoNotifier extends Notifier { ... }

// 합성을 통한 해결
public class Notifier {
    private List<NotificationChannel> channels;

    public void notify(String message) {
        channels.forEach(channel -> channel.send(message));
    }
}
```

### Discussion Point: 메시지와 메서드 분리를 통한 객체 자율성 확보

### Context & Background

객체지향에서 강조하는 "메시지"와 "메서드"의 분리에 대한 토론이 있었습니다. 특히 `DiscountPolicy`의 구현과 관련하여, 메시지 중심의 설계가 어떻게 더 나은 객체 자율성을 제공하는지 논의했습니다.

### Technical Deep Dive

```java
// 상위 클래스(추상 클래스)에서 알고리즘의 뼈대를 정의
public abstract class DiscountPolicy {
    public Money calculateDiscountAmount(Screening screening) {
        // 템플릿 메서드
        return getDiscountAmount(screening);
    }

    // 하위 클래스에서 구현할 추상 메서드
    protected abstract Money getDiscountAmount(Screening screening);
}

// 구체적인 구현을 제공하는 하위 클래스
public class AmountDiscountPolicy extends DiscountPolicy {
    @Override
    protected Money getDiscountAmount(Screening screening) {
        return Money.wons(1000);
    }
}

```

참가자들은 이 설계에서 다음과 같은 포인트들을 지적했습니다:

1. `calculateDiscountAmount`는 메시지, `getDiscountAmount`는 메서드로 볼 수 있다
2. 클라이언트는 구체적인 할인 정책의 구현 방식을 모르고도 메시지를 통해 협력할 수 있다
3. 각 할인 정책은 자신만의 방식으로 할인 금액을 계산할 자유를 가진다

### Various Perspectives

스터디 참가자들은 실제 프로젝트에서의 경험을 공유했습니다:

1. "메서드명으로 따로 빼주는 게 새로 코드를 읽을 때 좀 도메인만 대충 알아도 '아 이런 내용이 있구나' 정도로 이해할 수 있게 되는 것 같아요."
2. "코드가 문서화되는 효과가 있다고 느꼈어요."

### Discussion Point: 동적 바인딩과 정적 바인딩의 실제 적용

### Context & Background

오버라이딩(동적 바인딩)과 오버로딩(정적 바인딩)의 차이점에 대한 심도 있는 토론이 있었습니다. 특히 다음 예제를 통해 실제 동작 방식을 이해했습니다.

### Technical Deep Dive

```java
public class ClassifyExample {
    public void classify(Set s)      { System.out.println("Set"); }
    public void classify(List l)     { System.out.println("List"); }
    public void classify(Collection c){ System.out.println("Collection"); }

    public static void main(String[] args) {
        Collection[] collections = {
            new HashSet(),
            new ArrayList(),
            new HashMap().values()
        };

        ClassifyExample example = new ClassifyExample();
        for(Collection c : collections) {
            example.classify(c);  // 출력: "Collection" x 3
        }
    }
}

```

참가자들은 이 예제를 통해 다음을 이해했습니다:

- 오버로딩된 메서드의 선택은 컴파일 시점의 타입을 기준으로 한다
- 실제 런타임에 어떤 구현체가 전달되는지와 무관하게 선언된 타입을 기준으로 메서드가 선택된다

### Conclusions & Further Questions

1. 메서드 오버로딩 사용 시 주의사항:
    - 파라미터 타입의 계층 구조를 고려해야 한다
    - 컴파일 타임 타입 체크의 한계를 이해해야 한다
2. 향후 학습 과제:
    - 제네릭스와의 상호작용
    - 가변 인자(varargs)를 포함한 오버로딩

### Discussion Point: 클래스 다이어그램의 실제적 활용

### Context & Background

참가자들은 클래스 다이어그램이 단순한 문서화 도구를 넘어 도메인 제약사항을 표현하는 강력한 도구가 될 수 있다는 점을 발견했습니다.

### Technical Deep Dive

주요 토론 포인트:

1. 다중성(Multiplicity) 표현의 중요성
    - "0..1", "1..*" 등의 표기가 도메인 제약사항을 명확히 전달
2. 연관 관계의 종류
    - 실선(Association)
    - 점선(Dependency)
    - 상속(Inheritance)
    - 실체화(Realization)

```
Movie ───────┐ 1    *
             ├──────── Screening
             │
             │ 1    1
             ├──────── DiscountPolicy
             │         △
             │         │
             │    ┌────────┐
AmountDiscountPolicy  PercentDiscountPolicy

```

### Various Perspectives

- "클래스 다이어그램을 통해서 도메인 자체가 다 설명이 된다는 게 좀 저한테는 새로 다가왔어요."
- "저는 클래스 다이어그램을 살짝 무시했었는데, 고전은 괜히 고전이 아니더라고요."

## 3. Beyond the Book

참가자들은 다음과 같은 실제 적용 사례들을 공유했습니다:

1. 템플릿 메서드 패턴의 실제 활용
- GitHub, Jenkins 등에서의 웹훅 구현 사례
- 확장 가능한 알림 시스템 설계
1. 바람직한 상속 사용의 예
- 인터페이스 공유가 목적일 때만 상속 사용
- LSP(리스코프 치환 원칙) 준수의 중요성

## 4. Code Examples & Experiments

### 예제 1: 객체의 자율성을 높이는 리팩토링

```java
// Before
public class Theater {
    public void enter(Audience audience) {
        if (audience.getBag().hasInvitation()) {
            Ticket ticket = ticketSeller.getTicketOffice().getTicket();
            audience.getBag().setTicket(ticket);
        } else {
            Ticket ticket = ticketSeller.getTicketOffice().getTicket();
            audience.getBag().minusAmount(ticket.getFee());
            audience.getBag().setTicket(ticket);
        }
    }
}

// After
public class Audience {
    public Long buy(Ticket ticket) {
        return bag.hold(ticket);
    }
}

public class TicketSeller {
    public void sellTo(Audience audience) {
        ticketOffice.plusAmount(audience.buy(ticketOffice.getTicket()));
    }
}

```

## 5. Resources & References

- 이펙티브 자바 - 아이템 18: 상속보다는 컴포지션을 사용하라
- GoF의 디자인 패턴 - 템플릿 메서드 패턴, 전략 패턴
- [오브젝트 스터디 예제 코드](https://github.com/eternity-oop/object)

이 문서는 실제 스터디에서 오간 기술적 토론과 인사이트를 중심으로 정리되었습니다. 추가적인 예제나 설명이 필요한 부분이 있다면 알려주시기 바랍니다.
