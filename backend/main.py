from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests
from fastapi import Body

from database import get_db

from sqlalchemy.orm import Session

from fastapi import Depends

from models.trip import Trip
from models.schedule import Schedule

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        )

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

    db: Session = Depends(
        get_db
    )

):

    trips = db.query(
        Trip
    ).all()

    return trips

@app.get("/trip/{trip_id}")
def get_trip(

    trip_id: int,

    db: Session = Depends(
        get_db
    )

):

    trip = (

        db.query(Trip)

        .filter(
            Trip.id ==
            trip_id
        )

        .first()

    )

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

    return {

        "id":
            schedule.id

    }

@app.get("/schedule/{trip_id}")
def get_schedule(

    trip_id: int,

    db: Session = Depends(
        get_db
    )

):

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