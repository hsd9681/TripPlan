# ✈️ TripPlan AI

> AI가 여행 일정을 자동으로 만들어주는 스마트 여행 계획 서비스

🔗 **배포 링크**: [https://trip-plan-indol.vercel.app](https://trip-plan-indol.vercel.app)

---

## 📌 프로젝트 소개

TripPlan AI는 사용자가 국가, 도시, 날짜, 인원을 입력하면 AI가 DAY별 여행 일정을 자동으로 생성해주는 풀스택 웹 서비스입니다.
직접 일정을 계획하거나 AI 추천 코스를 활용해 여행을 준비하고, 예산 관리와 메모까지 한 곳에서 관리할 수 있습니다.

---

## 🛠 기술 스택

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat)

### 외부 API
![Google Maps](https://img.shields.io/badge/Google_Maps_API-4285F4?style=flat&logo=googlemaps&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=flat)

### 인증
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens)
![OAuth](https://img.shields.io/badge/OAuth2.0-Google_&_Kakao-yellow?style=flat)

### 배포
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway)

---

## ✨ 주요 기능

### 🤖 AI 여행 일정 자동 생성
- 국가, 도시, 날짜, 인원 입력 시 Groq AI(LLaMA 3.3 70B)가 DAY별 일정 자동 생성
- Google Places API로 실제 장소 정보(좌표, 사진, 평점, 주소) 자동 연동
- 생성된 일정은 DB에 저장되어 수정/삭제 가능

### 🗺️ 지도 & 동선
- Google Maps API 기반 DAY별 경로 시각화
- 번호 마커로 방문 순서 표시
- GPS 기반 현재 위치 지도 이동
- 지도 내 카테고리별 주변 장소 검색 (맛집/카페/관광지/쇼핑/숙소)
- 장소 검색 자동완성
- 길찾기 (대중교통/도보/자동차)
- 출발/도착 버튼으로 바로 길찾기 연동
- 지도 드래그/줌 기반 카테고리 자동 재검색
- 장소 사진 슬라이더

### 💰 예산 관리
- 총 여행 예산 설정 및 DB 저장
- 장소별 예상 비용 입력 → 자동 합산 및 진행 바 표시
- 실시간 환율 계산기 (9개 통화 지원)
- 예산 초과 시 진행 바 빨간색 경고

### 📝 메모
- DAY별 메모 작성 (1초 디바운스 자동 저장)
- 다른 날 메모 미리보기 및 빠른 이동

### 🌤️ 날씨
- GPS 현재 위치 기반 실시간 날씨 (Open-Meteo API, 무료)
- 기온, 풍속, 습도 표시

### 🔐 인증
- 이메일/비밀번호 로그인 (bcrypt 암호화)
- 구글 OAuth 소셜 로그인
- 카카오 OAuth 소셜 로그인
- JWT 기반 인증 (HttpOnly 쿠키)
- 로그인 상태 유지
- provider 기반 소셜 계정 분리 (같은 이메일도 구글/카카오 별도 계정)

### 📤 공유 (새 섹션 추가)
- 카카오톡 공유 기능

---

## 📁 프로젝트 구조

```
TripPlan/
├── frontend/                # Next.js (App Router)
│   └── app/
│       ├── (main)/          # 로그인 후 레이아웃
│       │   ├── page.tsx     # 홈
│       │   ├── trip/
│       │   │   ├── [tripId]/    # 여행 상세 (일정/지도/예산/메모)
│       │   │   ├── create/      # 여행 직접 생성
│       │   │   ├── result/      # 여행 목록
│       │   │   └── ai-recommend/ # AI 추천 코스
│       │   └── settings/    # 설정 (닉네임/비밀번호 변경)
│       ├── auth/            # 소셜 로그인 콜백
│       ├── login/
│       ├── signup/
│       ├── components/      # SearchPanel (지도 검색)
│       ├── context/         # TripContext, SearchPanelContext
│       └── types/           # 공통 TypeScript 타입
│
└── backend/                 # FastAPI
    ├── main.py              # API 라우터 전체
    ├── database.py          # DB 연결
    └── models/
        ├── user.py
        ├── trip.py
        └── schedule.py
```

---

## 🔧 트러블슈팅

### 1. FastAPI 라우터 순서로 인한 422 에러
**문제** `POST /trip/ai-recommend` 요청 시 422 에러 발생

**원인** FastAPI는 라우터를 위에서부터 순서대로 매칭하는데, `GET /trip/{trip_id}`가 먼저 등록되어 있어서 `ai-recommend`가 `trip_id="ai-recommend"`로 잘못 매칭됨

**해결** 구체적인 경로(`/trip/ai-recommend`)를 동적 경로(`/trip/{trip_id}`)보다 **위에** 등록

```python
# ✅ 올바른 순서
@app.post("/trip/ai-recommend")  # 구체적 경로 먼저
def ai_recommend_trip(): ...

@app.get("/trip/{trip_id}")      # 동적 경로 나중에
def get_trip(): ...
```

---

### 2. 배포 환경에서 쿠키 전달 안 됨
**문제** 로컬에서는 로그인이 정상 동작하지만 Vercel 배포 후 쿠키가 전달되지 않아 모든 API가 401 반환

**원인** 프론트(Vercel)와 백엔드(Railway)가 서로 다른 도메인(Cross-Origin)이라 `samesite="lax"` 쿠키가 차단됨

**해결** 배포 환경에서 쿠키 설정 변경

```python
# 로컬 (samesite=lax, secure=False)
# 배포 (samesite=none, secure=True) 로 변경
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    samesite="none",   # ← 변경
    secure=True        # ← 변경 (HTTPS 필수)
)
```

---

### 3. Google Places 사진 403 에러
**문제** 배포 후 Google Places 장소 사진이 모두 403 Forbidden 에러

**원인** 프론트에서 `<img src="maps.googleapis.com/...&key=API_KEY">` 직접 호출 시 API 키에 설정된 HTTP Referer 제한에 걸림

**해결** 백엔드에 사진 프록시 엔드포인트 추가 → 프론트는 백엔드를 통해 사진 요청

```python
# 백엔드 프록시 엔드포인트
@app.get("/place-photo")
def place_photo(photo_reference: str):
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={MAPS_API_KEY}"
    response = httpx.get(url, follow_redirects=True)
    return StreamingResponse(iter([response.content]), media_type="image/jpeg")
```

```tsx
// 프론트: 백엔드 프록시로 변경
// 기존: src={`maps.googleapis.com/...&key=${API_KEY}`}
// 변경: src={`${API_URL}/place-photo?photo_reference=${photo}`}
```

---

### 4. SQLAlchemy 객체 직렬화 누락으로 NaN 에러
**문제** 프론트에서 `trip.id`가 `undefined` → URL이 `/trip/NaN`으로 요청됨

**원인** FastAPI에서 SQLAlchemy 모델 객체를 `return trip`으로 그대로 반환하면 `id` 같은 필드가 누락되는 경우 발생

**해결** 모든 DB 객체 반환 시 명시적으로 dict로 변환

```python
# 기존 (id 누락 위험)
return trip

# 변경 후 (명시적 직렬화)
return {
    "id": trip.id,
    "title": trip.title,
    ...
}
```

---

### 5. Groq/Gemini API 할당량 초과
**문제** AI 일정 생성 시 429 RESOURCE_EXHAUSTED 에러

**원인** Gemini API 무료 티어 일일 한도 초과 (`limit: 0`)

**해결** AI Provider를 교체 가능한 구조로 설계 후 Groq API(LLaMA 3.3 70B)로 전환. 무료로 충분한 할당량 제공

```python
def generate_ai_response(prompt: str) -> str:
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return response.choices[0].message.content
```

---

### 6. 환경변수명 충돌로 Gemini 인증 실패
**문제** `GOOGLE_API_KEY`와 `GEMINI_API_KEY` 두 환경변수가 공존할 때 Gemini SDK가 `GOOGLE_API_KEY`를 자동으로 가져다 써서 인증 실패

**원인** `google-genai` 패키지가 환경변수에서 `GOOGLE_API_KEY`를 자동 감지

**해결** Google Maps API 키 환경변수명을 `MAPS_API_KEY`로 변경하여 충돌 방지

---
### 7. useJsApiLoader 중복 호출로 인한 Google Maps 충돌

**문제** 배포 후 지도가 로드되지 않고 콘솔에 아래 에러 발생
Uncaught Error: Loader must not be called again with different options.
libraries: ["maps"] !== libraries: ["places"]

**원인** `tripId/page.tsx`와 `SearchPanel.tsx` 두 컴포넌트에서 각각 `useJsApiLoader`를 호출하는데 `libraries` 옵션이 달라서 충돌 발생. Google Maps JS API는 한 페이지에서 동일한 옵션으로만 로드 가능

**해결** 공통 라이브러리 설정 파일 생성 후 두 컴포넌트가 동일한 배열 참조를 사용하도록 통일

```ts
// lib/googleMaps.ts
export const GOOGLE_MAPS_LIBRARIES: ("places" | "maps")[] = ["places"]
```

```tsx
// 두 컴포넌트 모두 동일하게
import { GOOGLE_MAPS_LIBRARIES } from "../lib/googleMaps"

const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY!,
    libraries: GOOGLE_MAPS_LIBRARIES,  // 동일한 배열 참조
})
```

---

### 8. 카카오 소셜 로그인 쿠키 도메인 충돌

**문제** 카카오 로그인 성공 후 홈으로 이동하면 바로 로그인 페이지로 튕기는 현상 발생. 구글 로그인 후 로그아웃하고 카카오 로그인을 하면 정상 동작하는 이상한 패턴

**원인** 카카오는 프론트에서 `document.cookie`로 토큰을 저장하는 방식이라 쿠키가 2개 생성됨
- `tripplan-production-265c.up.railway.app` 도메인 — 백엔드가 설정한 쿠키
- `trip-plan-indol.vercel.app` 도메인 — 프론트가 `document.cookie`로 설정한 쿠키

두 쿠키가 공존하면서 백엔드가 어떤 쿠키를 읽어야 할지 혼동 발생. 또한 구글 로그인이 먼저 되어 있으면 기존 쿠키가 남아있어 카카오 로그인 후에도 구글 토큰을 읽는 문제 발생

**해결** 카카오도 구글과 동일하게 백엔드에서 쿠키를 설정하도록 변경. `document.cookie` 방식 완전 제거

```python
# 백엔드 — 카카오 토큰 API에서 직접 쿠키 설정
@app.post("/auth/kakao/token")
async def kakao_token(data: dict = Body(...), db: Session = Depends(get_db), response: Response = None):
    ...
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        samesite="none",
        secure=True
    )
    return {"user": {"id": user.id, "email": user.email, "nickname": user.nickname}}
```

```tsx
// 프론트 — document.cookie 제거, 백엔드 쿠키에 의존
const res = await api.post("/auth/kakao/token", { code })
// document.cookie = ... ← 제거
setUser(res.data.user)
window.location.href = "/"  // router.push 대신 완전 새로고침으로 쿠키 반영
```

---

### 9. passlib + bcrypt Python 3.13 버전 호환 문제

**문제** Railway 배포 후 회원가입/로그인 시 500 Internal Server Error 발생
(trapped) error reading bcrypt version
AttributeError: module 'bcrypt' has no attribute 'about'

**원인** Railway가 Python 3.13을 사용하는데, `passlib` 라이브러리가 `bcrypt` 버전을 읽는 방식이 최신 `bcrypt` 패키지와 호환되지 않음. `bcrypt` 4.1.x 이상에서 `__about__` 속성이 제거되어 `passlib`이 버전 확인에 실패

**해결** `requirements.txt`에서 호환되는 버전을 명시적으로 고정
기존
passlib[bcrypt]
변경 후 — 버전 고정
passlib[bcrypt]==1.7.4
bcrypt==4.0.1

---

### 10. 구글/카카오 동일 이메일 계정 충돌

**문제** 구글과 카카오에 동일한 이메일이 연동된 경우 두 소셜 로그인이 같은 계정으로 처리되어 여행 일정이 공유되는 문제 발생

**원인** 소셜 로그인 유저 조회 시 이메일만으로 식별하여 provider가 달라도 같은 계정으로 처리됨

```python
# 기존 — 이메일만으로 조회 (문제)
user = db.query(User).filter(User.email == email).first()
```

**해결** `User` 모델에 `provider` 컬럼 추가 후 이메일 + provider 조합으로 계정 식별

```python
# users 테이블에 provider 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR DEFAULT 'local';
```

```python
# 변경 후 — 이메일 + provider 조합으로 조회
user = db.query(User).filter(
    User.email == email,
    User.provider == "google"  # 또는 "kakao", "local"
).first()

if not user:
    user = User(email=email, nickname=name, password="GOOGLE_OAUTH", provider="google")
```

이제 같은 이메일이라도 `provider`가 다르면 완전히 별개의 계정으로 처리됨


## 🚀 로컬 실행 방법

### 백엔드
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

### 환경변수 설정
`backend/.env`
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MAPS_API_KEY=your-google-maps-key
GROQ_API_KEY=your-groq-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
KAKAO_REST_API_KEY=your-kakao-key
KAKAO_CLIENT_SECRET=your-kakao-secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAP_KEY=your-google-maps-key
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-js-key
```

---

## 📸 스크린샷

### 홈 화면
<img width="1747" height="943" alt="home" src="https://github.com/user-attachments/assets/45356efa-6276-4ab5-97bb-7fe18b199ccc" />

### AI 추천 코스
<img width="552" height="731" alt="ai1" src="https://github.com/user-attachments/assets/e186414e-a181-421a-bb71-05fa00f15fd7" />

<img width="628" height="507" alt="ai2" src="https://github.com/user-attachments/assets/687c0656-e447-4e7b-b9fa-3a03262fd8ad" />

### 여행 상세, 예산 탭
<img width="1344" height="927" alt="detail" src="https://github.com/user-attachments/assets/8f3a426c-be52-485a-9682-314ca13279d3" />

<img width="1111" height="927" alt="detail2" src="https://github.com/user-attachments/assets/e71720eb-7b81-46e5-ab30-9f190e457f3f" />

### 지도 검색 패널

<img width="1077" height="942" alt="map" src="https://github.com/user-attachments/assets/2e24c601-4c5b-4023-b904-2dd72d3ffa8b" />


---

## 👨‍💻 개발자

- **홍성도** — Junior Full Stack Developer
- GitHub: [https://github.com/hsd9681](https://github.com/hsd9681)
