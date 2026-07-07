from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from fastapi import Body
from fastapi import Response
from database import get_db

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import Depends

from models.trip import Trip
from models.schedule import Schedule
from models.user import User

import httpx
from fastapi.responses import RedirectResponse
from groq import Groq
from datetime import datetime, timedelta, date
import json as json_module

from jose import jwt, JWTError

from fastapi import Request

load_dotenv()

SECRET_KEY = os.getenv(
    "SECRET_KEY"
)

ALGORITHM = os.getenv(
    "ALGORITHM"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(

    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES"
    )

)


def get_current_user(

        request: Request,

        db: Session = Depends(
            get_db
        )

):
    print(
        "COOKIES =",
        request.cookies
    )

    token = request.cookies.get(

        "access_token"

    )

    print(
        "TOKEN =",
        token
    )

    if not token:
        return None

    try:

        payload = jwt.decode(

            token,

            SECRET_KEY,

            algorithms=[
                ALGORITHM
            ]

        )

        print(
            "PAYLOAD =",
            payload
        )

        user_id = int(
            payload["sub"]
        )

        user = (

            db.query(User)

            .filter(
                User.id ==
                user_id
            )

            .first()

        )

        print(
            "USER =",
            user
        )

        return user

    except JWTError as e:

        print(
            "JWT ERROR =",
            e
        )

        return None

# ──────────────────────────────────────────
# 환경변수
# ──────────────────────────────────────────
MAPS_API_KEY = os.getenv("MAPS_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")

app = FastAPI()

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)


@app.get("/places")
def places(query: str):
    url = (
        "https://maps.googleapis.com/maps/api/place/textsearch/json"
    )

    params = {
        "query": query,
        "key": MAPS_API_KEY
    }

    response = requests.get(url, params=params)

    return response.json()


@app.get("/route")
def route(
        origin: str,
        destination: str
):
    url = (
        "https://maps.googleapis.com/maps/api/directions/json"
    )

    params = {
        "origin": origin,
        "destination": destination,
        "mode": "driving",
        "language": "ko",
        "key": MAPS_API_KEY
    }

    data = requests.get(
        url,
        params=params
    ).json()

    route = data["routes"][0]
    leg = route["legs"][0]

    return {

        "distance":
            leg["distance"]["text"],

        "duration":
            leg["duration"]["text"],

        "polyline":
            route["overview_polyline"]["points"],

        "start":
            leg["start_location"],

        "end":
            leg["end_location"]

    }


@app.get("/nearby")
def nearby(
        lat: float,
        lng: float,
        category: str
):
    category_map = {

        "맛집": "restaurant",

        "카페": "cafe",

        "관광지": "tourist_attraction",

        "쇼핑": "shopping_mall",

        "숙소": "lodging"

    }

    place_type = category_map.get(
        category,
        "restaurant"
    )

    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    )

    params = {

        "location":
            f"{lat},{lng}",

        "radius":
            3000,

        "type":
            place_type,

        "language":
            "ko",

        "key":
            MAPS_API_KEY

    }

    response = requests.get(
        url,
        params=params
    )

    return response.json()


@app.get("/place-detail")
def place_detail(place_id: str):
    url = (
        "https://maps.googleapis.com/maps/api/place/details/json"
    )

    params = {
        "place_id": place_id,
        "language": "ko",
        "key": MAPS_API_KEY
    }

    response = requests.get(
        url,
        params=params
    )

    return response.json()


@app.post("/trip")
def create_trip(


    trip: dict,


    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):
    new_trip = Trip(

        title=trip.get(
            "title"
        ),

        country=trip.get(
            "country"
        ),

        city=trip.get(
            "city"
        ),

        start_date=trip.get(
            "start_date"
        ),

        end_date=trip.get(
            "end_date"
        ),

        people=trip.get(
            "people"
        ),
        user_id = current_user.id

    )

    db.add(
        new_trip
    )

    db.commit()

    db.refresh(
        new_trip
    )

    return {

        "id":
            new_trip.id

    }


@app.get("/trip")
def get_trip_list(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):
    if not current_user:
        return {
            "message": "unauthorized"
        }

    trips = (

        db.query(Trip)

        .filter(
            Trip.user_id
            == current_user.id
        )

        .all()

    )

    return [
        {
            "id": t.id,
            "title": t.title,
            "country": t.country,
            "city": t.city,
            "start_date": str(t.start_date),
            "end_date": str(t.end_date),
            "people": t.people,
            "budget": t.budget,
            "created_at": str(t.created_at),
        }
        for t in trips
    ]


@app.get("/trip/upcoming")
def upcoming_trip(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    today = date.today()

    # 1. 현재 진행 중인 여행 우선
    trip = (
        db.query(Trip)
        .filter(
            Trip.user_id == current_user.id,
            Trip.start_date <= today,
            Trip.end_date >= today
        )
        .order_by(Trip.start_date.asc())
        .first()
    )

    # 2. 진행 중인 여행이 없으면 가장 가까운 미래 여행
    if not trip:
        trip = (
            db.query(Trip)
            .filter(
                Trip.user_id == current_user.id,
                Trip.start_date >= today
            )
            .order_by(Trip.start_date.asc())
            .first()
        )

    if not trip:
        return {}

    days = (
        db.query(
            Schedule.day_number,
            func.count(Schedule.id)
        )
        .filter(
            Schedule.trip_id == trip.id
        )
        .group_by(
            Schedule.day_number
        )
        .all()
    )

    completed_days = 0

    for day, count in days:
        if count >= 3:
            completed_days += 1

    total_days = (
                         trip.end_date - trip.start_date
                 ).days + 1

    progress = int(
        completed_days / total_days * 100
    )

    return {
        "id": trip.id,
        "title": trip.title,
        "country": trip.country,
        "city": trip.city,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "progress": progress
    }



# ──────────────────────────────────────────
# Gemini 호출 함수
# ──────────────────────────────────────────

def generate_ai_response(prompt: str) -> str:
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return response.choices[0].message.content


# ──────────────────────────────────────────
# AI 추천 코스 생성
# ──────────────────────────────────────────

@app.post("/trip/ai-recommend")
def ai_recommend_trip(
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"message": "unauthorized"}

    print("DATA =", data)

    country    = data.get("country", "")
    city       = data.get("city", "")
    start_date = data.get("start_date", "")
    end_date   = data.get("end_date", "")
    people     = data.get("people", 1)

    delta = datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")
    total_days = delta.days + 1

    prompt = f"""
당신은 여행 전문가입니다. 아래 조건에 맞는 여행 일정을 JSON으로만 답하세요.

조건:
- 국가: {country}
- 도시: {city}
- 기간: {total_days}일
- 인원: {people}명

규칙:
- 하루에 장소 4~5개 추천
- 실제 존재하는 유명한 관광지, 맛집, 카페, 쇼핑 명소만 추천
- duration은 해당 장소 체류 시간(분 단위, 60~120)
- category는 관광지/맛집/카페/쇼핑/문화 중 하나
- Google Places에서 검색 가능한 정확한 영문 장소명 사용
- search_query는 Google Places 검색에 최적화된 영문 쿼리

반드시 아래 JSON 형식으로만 답하세요. 마크다운 없이 순수 JSON만:
{{
  "title": "{city} {total_days}일 여행",
  "days": [
    {{
      "day": 1,
      "places": [
        {{
          "name": "Senso-ji Temple",
          "name_ko": "센소지",
          "category": "관광지",
          "duration": 90,
          "search_query": "Senso-ji Temple Asakusa Tokyo"
        }}
      ]
    }}
  ]
}}
"""

    try:
        raw = generate_ai_response(prompt).strip()
        print("RAW AI 응답 =", raw[:200])  # ← 여기에 추가
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        ai_data = json_module.loads(raw.strip())
        print("PARSED =", ai_data)  # ← 여기에 추가
    except Exception as e:
        print("파싱 에러 =", e)
        return {"message": f"AI 응답 파싱 실패: {str(e)}"}

    # Trip 생성
    new_trip = Trip(
        title=ai_data.get("title", f"{city} 여행"),
        country=country,
        city=city,
        start_date=start_date,
        end_date=end_date,
        people=people,
        user_id=current_user.id
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    trip_id = new_trip.id

    # Google Places로 각 장소 검색 후 Schedule 저장
    places_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    for day_data in ai_data.get("days", []):
        day_number = day_data["day"]
        for order, place in enumerate(day_data.get("places", []), start=1):
            search_query = place.get("search_query") or f"{place['name']} {city}"

            try:
                resp = requests.get(places_url, params={
                    "query": search_query,
                    "language": "ko",
                    "key": MAPS_API_KEY
                })
                results = resp.json().get("results", [])
            except Exception:
                results = []

            if results:
                p = results[0]
                geo = p.get("geometry", {}).get("location", {})
                photos = p.get("photos", [])
                schedule = Schedule(
                    trip_id=trip_id,
                    day_number=day_number,
                    order_no=order,
                    place_id=p.get("place_id", ""),
                    name=p.get("name", place.get("name_ko", place["name"])),
                    category=place.get("category", "관광지"),
                    photo=photos[0].get("photo_reference", "") if photos else "",
                    rating=p.get("rating"),
                    address=p.get("formatted_address", ""),
                    duration=place.get("duration", 90),
                    lat=geo.get("lat"),
                    lng=geo.get("lng"),
                    cost=0
                )
            else:
                schedule = Schedule(
                    trip_id=trip_id,
                    day_number=day_number,
                    order_no=order,
                    place_id="",
                    name=place.get("name_ko", place["name"]),
                    category=place.get("category", "관광지"),
                    photo="",
                    rating=None,
                    address="",
                    duration=place.get("duration", 90),
                    lat=None,
                    lng=None,
                    cost=0
                )

            db.add(schedule)

    db.commit()
    return {"trip_id": trip_id, "title": ai_data.get("title")}


@app.get("/trip/{trip_id}")
def get_trip(

    trip_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    if not current_user:

        return {
            "message":
                "unauthorized"
        }

    trip = (

        db.query(Trip)

        .filter(
            Trip.id ==
            trip_id
        )

        .first()

    )

    print("CURRENT USER =", current_user.id)
    print("TRIP USER =", trip.user_id)
    print("TRIP ID =", trip.id)

    if not trip:

        return {
            "message":
                "trip not found"
        }

    if (

        trip.user_id
        != current_user.id

    ):

        return {
            "message":
                "forbidden"
        }

    return {
        "id": trip.id,
        "title": trip.title,
        "country": trip.country,
        "city": trip.city,
        "start_date": str(trip.start_date),
        "end_date": str(trip.end_date),
        "people": trip.people,
        "budget": trip.budget,
        "created_at": str(trip.created_at),
    }


@app.post("/schedule")
def create_schedule(

        item: dict,

        db: Session = Depends(
            get_db
        )

):
    schedule = Schedule(

        trip_id=item.get(
            "trip_id"
        ),

        day_number=item.get(
            "day_number"
        ),

        order_no=item.get(
            "order_no"
        ),

        place_id=item.get(
            "place_id"
        ),

        name=item.get(
            "name"
        ),

        category=item.get(
            "category"
        ),

        photo=item.get(
            "photo"
        ),

        rating=item.get(
            "rating"
        ),

        address=item.get(
            "address"
        ),

        duration=item.get(
            "duration"
        ),

        lat=item.get(
            "lat"
        ),

        lng=item.get(
            "lng"
        )

    )

    db.add(schedule)

    db.commit()

    db.refresh(schedule)
    return schedule




@app.get("/schedule/{trip_id}")
def get_schedule(

    trip_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    if not current_user:

        return {
            "message":
                "unauthorized"
        }

    trip = (

        db.query(Trip)

        .filter(
            Trip.id ==
            trip_id
        )

        .first()

    )

    if not trip:

        return {
            "message":
                "trip not found"
        }

    if (

        trip.user_id
        != current_user.id

    ):

        return {
            "message":
                "forbidden"
        }

    schedules = (

        db.query(
            Schedule
        )

        .filter(
            Schedule.trip_id
            == trip_id
        )

        .order_by(
            Schedule.day_number,
            Schedule.order_no
        )

        .all()

    )

    return [
        {
            "id": s.id,
            "trip_id": s.trip_id,
            "day_number": s.day_number,
            "order_no": s.order_no,
            "place_id": s.place_id,
            "name": s.name,
            "category": s.category,
            "photo": s.photo,
            "rating": s.rating,
            "address": s.address,
            "duration": s.duration,
            "lat": s.lat,
            "lng": s.lng,
            "memo": s.memo,
            "cost": s.cost,
        }
        for s in schedules
    ]


@app.delete("/schedule/{schedule_id}")
def delete_schedule(

        schedule_id: int,

        db: Session = Depends(
            get_db
        )

):
    schedule = (

        db.query(
            Schedule
        )

        .filter(
            Schedule.id
            == schedule_id
        )

        .first()

    )

    if not schedule:
        return {

            "message":
                "not found"

        }

    db.delete(
        schedule
    )

    db.commit()

    return {

        "message":
            "deleted"

    }


@app.put("/schedule/order")
def update_schedule_order(

        items: list = Body(...),

        db: Session = Depends(
            get_db
        )

):
    for item in items:

        schedule = (

            db.query(
                Schedule
            )

            .filter(
                Schedule.id
                == item["id"]
            )

            .first()

        )

        if schedule:
            schedule.order_no = (
                item["order_no"]
            )

    db.commit()

    return {
        "message":
            "updated"
    }


@app.post("/signup")
def signup(

        user: dict,

        db: Session = Depends(
            get_db
        )

):
    exists = (

        db.query(User)

        .filter(
            User.email
            == user["email"]
        )

        .first()

    )

    if exists:
        return {

            "message":
                "email exists"

        }

    new_user = User(

        email=user["email"],

        password=user["password"],

        nickname=user["nickname"]

    )

    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )

    return {

        "id":
            new_user.id

    }


@app.post("/login")
def login(

        user: dict,

        response: Response,

        db: Session = Depends(
            get_db
        )

):
    db_user = (

        db.query(User)

        .filter(
            User.email
            == user["email"]
        )

        .first()

    )

    if not db_user:
        return {

            "message":
                "user not found"

        }

    if (

            db_user.password
            != user["password"]

    ):
        return {

            "message":
                "wrong password"

        }

    token = create_access_token(
        db_user.id
    )

    response.set_cookie(

        key="access_token",

        value=token,

        httponly=True,

        samesite="lax",

        secure=False

    )

    return {

        "message":
            "login success",

        "user": {

            "id":
                db_user.id,

            "email":
                db_user.email,

            "nickname":
                db_user.nickname

        }

    }


def create_access_token(
        user_id: int
):
    expire = (

            datetime.utcnow()

            + timedelta(

        minutes=
        ACCESS_TOKEN_EXPIRE_MINUTES

    )

    )

    payload = {

        "sub":
            str(user_id),

        "exp":
            expire

    }

    token = jwt.encode(

        payload,

        SECRET_KEY,

        algorithm=
        ALGORITHM

    )

    return token


@app.get("/me")
def me(

        user: User = Depends(
            get_current_user
        )

):
    if not user:
        return {

            "message":
                "unauthorized"

        }

    return {

        "id":
            user.id,

        "email":
            user.email,

        "nickname":
            user.nickname

    }

@app.post("/logout")
def logout(

    response: Response

):

    response.delete_cookie(

        key="access_token"

    )

    return {

        "message":
            "logout success"

    }

@app.delete("/trip/{trip_id}")
def delete_trip(

    trip_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):


    if not current_user:

        return {

            "message":
                "unauthorized"

        }


    trip = (

        db.query(Trip)

        .filter(
            Trip.id == trip_id
        )

        .first()

    )


    if not trip:

        return {

            "message":
                "trip not found"

        }


    if trip.user_id != current_user.id:

        return {

            "message":
                "forbidden"

        }


    db.query(Schedule).filter(

        Schedule.trip_id == trip_id

    ).delete()


    db.delete(trip)
    db.commit()

    return {

        "message":
            "trip deleted"

    }

@app.put("/schedule/{schedule_id}")
def update_schedule(

    schedule_id: int,

    data: dict,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):

    schedule = (

        db.query(Schedule)

        .filter(
            Schedule.id == schedule_id
        )

        .first()

    )

    if not schedule:

        return {
            "message": "schedule not found"
        }

    trip = (

        db.query(Trip)

        .filter(
            Trip.id == schedule.trip_id
        )

        .first()

    )

    if trip.user_id != current_user.id:

        return {
            "message": "forbidden"
        }

    schedule.place_id = data["place_id"]
    schedule.name = data["name"]
    schedule.category = data["category"]
    schedule.photo = data["photo"]
    schedule.rating = data["rating"]
    schedule.address = data["address"]
    schedule.duration = data["duration"]
    schedule.lat = data["lat"]
    schedule.lng = data["lng"]

    db.commit()
    db.refresh(schedule)

    return schedule

# ──────────────────────────────────────────
# 예산 저장 (총 예산)
# ──────────────────────────────────────────

@app.put("/trip/{trip_id}/budget")
def update_trip_budget(

    trip_id: int,

    data: dict,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):
    if not current_user:
        return {"message": "unauthorized"}

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip:
        return {"message": "trip not found"}

    if trip.user_id != current_user.id:
        return {"message": "forbidden"}

    trip.budget = data.get("budget", 0)

    db.commit()
    db.refresh(trip)

    return {"budget": trip.budget}


# ──────────────────────────────────────────
# 일정 비용 업데이트
# ──────────────────────────────────────────

@app.put("/schedule/{schedule_id}/cost")
def update_schedule_cost(

    schedule_id: int,

    data: dict,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):
    if not current_user:
        return {"message": "unauthorized"}

    schedule = (
        db.query(Schedule)
        .filter(Schedule.id == schedule_id)
        .first()
    )

    if not schedule:
        return {"message": "not found"}

    schedule.cost = data.get("cost", 0)

    db.commit()
    db.refresh(schedule)

    return {"id": schedule.id, "cost": schedule.cost}


# ──────────────────────────────────────────
# 메모 저장 (일정별)
# ──────────────────────────────────────────

@app.put("/schedule/{schedule_id}/memo")
def update_schedule_memo(

    schedule_id: int,

    data: dict,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):
    if not current_user:
        return {"message": "unauthorized"}

    schedule = (
        db.query(Schedule)
        .filter(Schedule.id == schedule_id)
        .first()
    )

    if not schedule:
        return {"message": "not found"}

    schedule.memo = data.get("memo", "")

    db.commit()
    db.refresh(schedule)

    return {"id": schedule.id, "memo": schedule.memo}


# ──────────────────────────────────────────
# 일별 메모 저장 (trip + day_number 기준 첫 번째 schedule에 저장)
# 또는 day_memo 테이블 대신 trip 레벨에서 JSON으로 관리
# ──────────────────────────────────────────

@app.put("/trip/{trip_id}/day-memo")
def update_day_memo(

    trip_id: int,

    data: dict,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):
    """
    data: { day_number: int, memo: str }
    해당 day의 첫 번째 schedule에 memo를 저장.
    일정이 없으면 memo_only 더미 레코드 생성.
    """
    if not current_user:
        return {"message": "unauthorized"}

    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id)
        .first()
    )

    if not trip or trip.user_id != current_user.id:
        return {"message": "forbidden"}

    day_number = data.get("day_number")
    memo_text = data.get("memo", "")

    # 해당 day의 첫 번째 schedule 조회
    schedule = (
        db.query(Schedule)
        .filter(
            Schedule.trip_id == trip_id,
            Schedule.day_number == day_number
        )
        .order_by(Schedule.order_no)
        .first()
    )

    if schedule:
        schedule.memo = memo_text
        db.commit()
        return {"message": "updated", "id": schedule.id}

    # 일정이 없는 경우 memo 전용 더미 레코드 생성
    dummy = Schedule(
        trip_id=trip_id,
        day_number=day_number,
        order_no=0,
        name="__memo__",
        memo=memo_text,
        cost=0
    )
    db.add(dummy)
    db.commit()
    db.refresh(dummy)

    return {"message": "created", "id": dummy.id}


# ──────────────────────────────────────────
# 일별 메모 조회
# ──────────────────────────────────────────

@app.get("/trip/{trip_id}/day-memo/{day_number}")
def get_day_memo(

    trip_id: int,

    day_number: int,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db)

):
    if not current_user:
        return {"message": "unauthorized"}

    schedule = (
        db.query(Schedule)
        .filter(
            Schedule.trip_id == trip_id,
            Schedule.day_number == day_number
        )
        .order_by(Schedule.order_no)
        .first()
    )

    return {"memo": schedule.memo if schedule else ""}

# ──────────────────────────────────────────
# 닉네임 변경
# ──────────────────────────────────────────

@app.put("/me/nickname")
def update_nickname(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"message": "unauthorized"}

    current_user.nickname = data.get("nickname", current_user.nickname)
    db.commit()
    db.refresh(current_user)

    return {"id": current_user.id, "nickname": current_user.nickname}


# ──────────────────────────────────────────
# 비밀번호 변경
# ──────────────────────────────────────────

@app.put("/me/password")
def update_password(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"message": "unauthorized"}

    if current_user.password != data.get("current_password"):
        return {"message": "wrong password"}

    current_user.password = data.get("new_password")
    db.commit()

    return {"message": "success"}


@app.get("/auth/google")
def google_login():
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri=http://localhost:8000/auth/google/callback"
        f"&response_type=code"
        f"&scope=openid email profile"
        f"&access_type=offline"
    )
    return RedirectResponse(google_auth_url)


@app.get("/auth/google/callback")
def google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    # ── 1. 코드로 액세스 토큰 교환 ──
    token_res = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": "http://localhost:8000/auth/google/callback",
            "grant_type": "authorization_code",
        }
    )
    token_data = token_res.json()
    access_token = token_data.get("access_token")

    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_token_failed")

    # ── 2. 액세스 토큰으로 유저 정보 조회 ──
    user_res = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user_info = user_res.json()

    email = user_info.get("email")
    name = user_info.get("name", "구글유저")

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_email_failed")

    # ── 3. DB에서 유저 조회 or 자동 회원가입 ──
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            nickname=name,
            password="GOOGLE_OAUTH"  # 소셜 로그인은 비밀번호 없음
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # ── 4. JWT 토큰 발급 후 프론트로 리다이렉트 ──
    jwt_token = create_access_token(user.id)

    response = RedirectResponse(f"{FRONTEND_URL}/auth/google/success")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return response

# ──────────────────────────────────────────
# 카카오 OAuth 로그인
# ──────────────────────────────────────────

@app.get("/auth/kakao")
def kakao_login():
    kakao_auth_url = (
        "https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_REST_API_KEY}"
        f"&redirect_uri={FRONTEND_URL}/auth/kakao/callback"
        f"&response_type=code"
    )
    return RedirectResponse(kakao_auth_url)


@app.post("/auth/kakao/token")
async def kakao_token(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    code = data.get("code")

    # ── 1. 코드로 액세스 토큰 교환 ──
    token_res = httpx.post(
        "https://kauth.kakao.com/oauth/token",
        data={
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "client_secret": KAKAO_CLIENT_SECRET,
            "redirect_uri": f"{FRONTEND_URL}/auth/kakao/callback",
            "code": code,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_data = token_res.json()
    access_token = token_data.get("access_token")

    if not access_token:
        return {"message": "kakao_token_failed"}

    # ── 2. 액세스 토큰으로 유저 정보 조회 ──
    user_res = httpx.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    user_info = user_res.json()

    kakao_account = user_info.get("kakao_account", {})
    email = kakao_account.get("email")
    nickname = user_info.get("properties", {}).get("nickname", "카카오유저")

    # 이메일 없는 경우 카카오 ID로 대체
    if not email:
        email = f"kakao_{user_info.get('id')}@kakao.com"

    # ── 3. DB에서 유저 조회 or 자동 회원가입 ──
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            nickname=nickname,
            password="KAKAO_OAUTH"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # ── 4. JWT 토큰 발급 ──
    jwt_token = create_access_token(user.id)

    return {
        "access_token": jwt_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
        }
    }