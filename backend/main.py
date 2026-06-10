from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests


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
