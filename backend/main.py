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

from jose import jwt
from datetime import datetime, timedelta, date

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


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

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
        "key": GOOGLE_API_KEY
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
        "key": GOOGLE_API_KEY
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
            GOOGLE_API_KEY

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
        "key": GOOGLE_API_KEY
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

    return trips


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

    return trip


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

    return schedules


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