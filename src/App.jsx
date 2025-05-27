import axios from "axios";
import { useEffect, useState } from "react";

const WEATHER_API_KEY = "3a8d9360da8088d38d71ff635e554318";

function App() {
  const [coordinates, setCoordinates] = useState(null);
  const lat = coordinates?.[0];
  const lon = coordinates?.[1];

  useEffect(
    function () {
      if (!lat || !lon) return;
      console.log(lat);
      console.log(lon);
    },
    [lat, lon]
  );

  return (
    <div>
      <Main setCoordinates={setCoordinates} />
    </div>
  );
}

function Main({ setCoordinates }) {
  const [location, setLocation] = useState("");
  const [foundLocations, setFoundLocations] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchLocation() {
        setFoundLocations("");
        setError("");
        setIsLoading(true);
        try {
          const requestedLocation = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${location}&format=json`,
            { signal: controller.signal }
          );
          setFoundLocations(requestedLocation.data);
          console.log(requestedLocation.data);
        } catch (err) {
          if (axios.isCancel?.(err)) {
            console.log("Fetch aborted ", err.message);
          } else {
            setError(err.message || "Something went wrong");
            console.error(err);
          }
        } finally {
          setIsLoading(false);
        }
      }

      const fetchLocationTimeout = setTimeout(() => {
        if (location.length >= 2) fetchLocation();
      }, 100);

      return function () {
        clearTimeout(fetchLocationTimeout);
        controller.abort();
      };
    },
    [location]
  );

  return (
    <main>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Choose a location"
      ></input>
      {foundLocations && (
        <LocationDisplay
          foundLocations={foundLocations}
          setCoordinates={setCoordinates}
        />
      )}
      {isLoading && <Loader />}
      {error && <Error error={error} />}
    </main>
  );
}

function LocationDisplay({ foundLocations, setCoordinates }) {
  return (
    <ul>
      {foundLocations.map((location) => (
        <Location
          display_name={location.display_name}
          key={location.place_id}
          setCoordinates={setCoordinates}
          location={location}
        />
      ))}
    </ul>
  );
}

function Location({ display_name, setCoordinates, location }) {
  return (
    <li onClick={() => setCoordinates([location.lat, location.lon])}>
      {display_name}
    </li>
  );
}

function Loader() {
  return <p>Loading...</p>;
}

function Error({ error }) {
  return <p>{error}</p>;
}

export default App;
