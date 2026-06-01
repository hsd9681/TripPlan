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

@app.get("/route-test")
def route_test():

    url = (
        "https://maps.googleapis.com/maps/api/directions/json"
    )

    params = {
        "origin": "Tokyo Station",
        "destination": "Tokyo Tower",
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

        "distance": leg["distance"]["text"],

        "duration": leg["duration"]["text"],

        "polyline": route["overview_polyline"]["points"],

        "start": {
            "lat": leg["start_location"]["lat"],
            "lng": leg["start_location"]["lng"]
        },

        "end": {
            "lat": leg["end_location"]["lat"],
            "lng": leg["end_location"]["lng"]
        }
    }