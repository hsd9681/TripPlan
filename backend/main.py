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
