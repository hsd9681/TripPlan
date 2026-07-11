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
```

---

## 📸 스크린샷

> 스크린샷 추가 예정

---

## 👨‍💻 개발자

- **홍성도** — Junior Full Stack Developer
- GitHub: [https://github.com/hsd9681](https://github.com/hsd9681)