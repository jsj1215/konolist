# PRD: 코노리스트 (KonoList)

> 코인 노래방 전용 플레이리스트 관리 웹 서비스

> **참고:** 이 문서는 개발 전에 작성한 초기 기획서입니다. 구현하면서 인증 방식이 카카오 OAuth에서 이메일/비밀번호로 바뀌었고, Next.js 버전, 곡 캐시 구조(별도 Song 테이블 → Redis 캐시), QueryDSL 사용 여부 등도 달라졌습니다. 녹음 기능처럼 기획에 없던 기능도 추가되었습니다. 실제 구현은 [README](README.md)를 기준으로 봐주세요.

---

## 1. 프로젝트 개요

### 목적
코인 노래방 이용자가 노래 번호를 미리 저장·분류하고, 방문 시 즉시 꺼내보며, 지인과 공유하고, 방문 기록을 남길 수 있는 모바일 웹 서비스.

### 핵심 가치
- **번거로운 번호 검색 생략**: TJ 번호가 바로 보이는 플레이리스트
- **개인화된 리스트 관리**: 테마별 폴더 + 메모 + 순서 조정
- **방문 기록 다이어리**: 캘린더 기반 노래방 로그
- **공유**: 공개 URL로 친구에게 내 리스트 전송

---

## 2. 타겟 유저
- 코인 노래방을 자주 가지만 매번 무엇을 부를지 고민하는 사람
- 자신만의 애창곡 리스트를 테마별로 정리하고 싶은 사람
- 노래방 방문 기록을 남기고 싶은 사람

---

## 3. 플랫폼 & 환경
- **주 플랫폼**: 모바일 웹 (반응형). 네이티브 앱 없음.
- **인증**: 이메일/비밀번호 회원가입·로그인. JWT 발급, NextAuth.js Credentials provider 사용.

---

## 4. 핵심 기능 (MVP 우선순위 순)

### 4-1. 노래 검색 + 플레이리스트 저장 ⭐ 최우선
- 제목/가수명 통합 검색
- 검색 결과에 **TJ 노래방 번호** 필수 표시
- 검색된 곡을 원하는 플레이리스트에 즉시 추가 (버튼 1탭)
- 데이터 소스: TJ미디어 홈페이지 실시간 크롤링 + Redis 캐시 (TTL 1시간)

### 4-2. 플레이리스트(폴더) 관리
- 폴더 생성 / 수정 / 삭제
- 드래그 앤 드롭으로 곡 순서 변경
- 곡별 메모 기능 (예: "2키 낮춰서")

### 4-3. 공유 및 공개 설정 ⭐ 중요
- 플레이리스트별 공개/비공개 토글
- 공개 시 고유 URL 자동 생성
- 비로그인 사용자도 공개 플레이리스트 조회 가능
- 다른 사람의 공개 리스트를 내 보관함으로 복사

### 4-4. 캘린더 방문 기록 (Karaoke Log)
- 앱 내 캘린더 뷰
- 날짜 선택 → 해당 날 사용한 플레이리스트 연결
- 방문 기록 없이 '일반 플레이리스트'로만 사용하는 옵션도 지원

---

## 5. 인수 기준 (Acceptance Criteria)

| # | 기준 | 검증 방법 |
|---|------|----------|
| 1 | 카카오 로그인 후 내 플레이리스트 목록 조회 | E2E |
| 2 | 노래 제목/가수 검색 시 TJ 번호 포함 결과 반환 | E2E |
| 3 | 검색 결과에서 플레이리스트에 곡 추가 (1탭) | E2E |
| 4 | 플레이리스트 내 곡 순서 드래그 앤 드롭 변경 | 수동 |
| 5 | 곡별 메모 추가/수정 | E2E |
| 6 | 플레이리스트 공개 전환 후 고유 URL 생성 | E2E |
| 7 | 공유 URL로 비로그인 사용자 조회 가능 | E2E |
| 8 | 다른 사람 공개 리스트 내 보관함으로 복사 | E2E |
| 9 | 캘린더 날짜 → 플레이리스트 연결 → 조회 | E2E |
| 10 | 모바일 기준 LCP 3초 이내 | Lighthouse |

---

## 6. 데이터 모델

```
User
  - id, kakaoId, nickname, profileImage, createdAt

Playlist
  - id, userId, title, description
  - isPublic (boolean), shareToken (UUID)
  - createdAt, updatedAt

Song (캐시 테이블)
  - id, title, artist, tjNumber
  - cachedAt

PlaylistSong (중간 테이블)
  - id, playlistId, songId
  - memo, sortOrder

CalendarLog
  - id, userId, date (DATE), playlistId
```

---

## 7. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Frontend | Next.js 14 (App Router, TypeScript) | 모바일 반응형 |
| Backend | Spring Boot 3 (Java 21) | REST API |
| ORM | Spring Data JPA + QueryDSL | |
| Database | PostgreSQL | Neon 또는 Supabase (무료) |
| Cache | Redis | Upstash 무료 티어, 크롤링 결과 캐싱 |
| Auth | NextAuth.js (Kakao provider) + Spring Security | |
| 크롤러 | Jsoup (Spring 내장) | TJ 홈페이지 크롤링 |
| 드래그앤드롭 | @dnd-kit/core | react-beautiful-dnd 대신 (유지보수 활성) |
| 배포 | Vercel (FE) + Railway (BE) | 무료 티어 |
| CI/CD | GitHub Actions | 선택 사항 |

---

## 8. 시스템 아키텍처

```
[Mobile Browser]
      │
      ▼
[Next.js / Vercel]
   ├── 정적 페이지 (공개 플레이리스트 SSR → SEO)
   └── API Routes → 카카오 OAuth, NextAuth 세션
      │
      ▼ REST API
[Spring Boot / Railway]
   ├── PlaylistController
   ├── SongController (검색 → 크롤러 → Redis)
   └── CalendarLogController
      │
      ├──▶ [PostgreSQL / Neon]
      └──▶ [Redis / Upstash]
              └── 크롤링 결과 캐시 (TTL 1h)
                      │
                      ▼ (캐시 미스 시)
              [TJ미디어 홈페이지]
```

---

## 9. 검색 플로우 (크롤링)

```
1. 유저 검색어 입력
2. Redis에서 "search:{query}" 키 조회
   ├── HIT → 즉시 반환 (캐시된 결과)
   └── MISS → TJ 홈페이지 Jsoup 크롤링
              → 결과 파싱 (곡명, 가수, TJ번호)
              → Redis 저장 (TTL: 1시간)
              → 클라이언트 반환
```

---

## 10. Non-Goals (MVP 제외)
- iOS/Android 네이티브 앱
- 금영(KY) 번호 지원
- 음악 스트리밍/재생
- MBTI별 추천 (향후 확장)
- 녹음 파일 업로드 (향후 확장)
- 친구 팔로우/알림 (향후 확장)

---

## 11. 향후 확장 계획
- 사용자 데이터 기반 인기 노래 추천
- 녹음본 첨부 (방문 기록에)
- 친구 팔로우 + 새 플레이리스트 알림
