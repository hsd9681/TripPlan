'use client';

import { useState } from 'react';

export default function Home() {
  const [placeQuery, setPlaceQuery] = useState('sushi in Tokyo ');
  const [placeResult, setPlaceResult] = useState<any>(null);

  const [city, setCity] = useState('Tokyo');
  const [geoResult, setGeoResult] = useState<any>(null);

  const [origin, setOrigin] = useState('Sensoji');
  const [destination, setDestination] = useState('Tokyo Tower');
  const [directionResult, setDirectionResult] = useState<any>(null);

  const searchPlaces = async () => {
    const res = await fetch(
      `http://localhost:8000/places?query=${placeQuery}`
    );

    const data = await res.json();
    setPlaceResult(data);
  };

  const searchGeo = async () => {
    const res = await fetch(
      `http://localhost:8000/geocode?city=${city}`
    );

    const data = await res.json();
    setGeoResult(data);
  };

  const searchDirection = async () => {
    const res = await fetch(
      `http://localhost:8000/directions?origin=${origin}&destination=${destination}`
    );

    const data = await res.json();
    setDirectionResult(data);
  };

  return (
    <main style={{ padding: '40px' }}>
      <h1>Google API Playground</h1>

      <hr />

      <h2>Places API</h2>

      <input
        value={placeQuery}
        onChange={(e) => setPlaceQuery(e.target.value)}
      />

      <button onClick={searchPlaces}>
        검색
      </button>

      <pre>
        {JSON.stringify(placeResult, null, 2)}
      </pre>

      <hr />

      <h2>Geocoding API</h2>

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <button onClick={searchGeo}>
        검색
      </button>

      <pre>
        {JSON.stringify(geoResult, null, 2)}
      </pre>

      <hr />

      <h2>Directions API</h2>

      <div>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />

        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <button onClick={searchDirection}>
          검색
        </button>
      </div>

      <pre>
        {JSON.stringify(directionResult, null, 2)}
      </pre>
    </main>
  );
}