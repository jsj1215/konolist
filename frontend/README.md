# konolist frontend

코노리스트의 웹 프론트엔드입니다. Next.js 16 (App Router), React 19, Tailwind CSS 4, NextAuth로 구성되어 있고, 데이터는 `backend/`의 Spring Boot API에서 받아옵니다.

프로젝트 전체 소개와 백엔드 실행 방법은 [루트 README](../README.md)를 참고하세요.

## 실행 방법

```bash
npm install
cp .env.local.example .env.local   # 아래 환경 변수 값을 채움
npm run dev                        # http://localhost:3000
```

## 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `NEXTAUTH_URL` | 프론트엔드 주소 | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth 세션 서명 키. `openssl rand -base64 32`로 생성 | (직접 생성) |
| `NEXT_PUBLIC_API_URL` | 백엔드 API 주소 | `http://localhost:8080` |

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint 검사 |
