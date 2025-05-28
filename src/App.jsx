import axios from "axios";
import { useEffect, useState } from "react";
import styles from "./App.module.css";

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

function App() {
  const [coordinates, setCoordinates] = useState(null);
  const lat = coordinates?.[0];
  const lon = coordinates?.[1];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [airPollution, setAirPollution] = useState(null);

  useEffect(
    function () {
      if (!lat || !lon) return;

      const controller = new AbortController();

      async function fetchWeatherData() {
        setIsLoading(true);
        setError("");
        setAirPollution(null);
        try {
          const airData = await axios.get(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`,
            { signal: controller.signal }
          );
          const pm2_5 = airData.data.list[0].components.pm2_5;
          setAirPollution(pm2_5);
        } catch (err) {
          if (axios.isCancel?.(err)) {
            console.log(err.message);
          } else {
            setError(err.message);
            console.error(err);
          }
        } finally {
          setIsLoading(false);
        }
      }

      fetchWeatherData();

      return function () {
        controller.abort();
      };
    },
    [lat, lon]
  );

  return (
    <div className={styles.container}>
      <Header />
      <LocationSearch
        setCoordinates={setCoordinates}
        setAirPollution={setAirPollution}
      />
      {airPollution && <AirPollution pm2_5={airPollution} />}
      {isLoading && <Loader>Loading data...</Loader>}
      {error && <Error />}
    </div>
  );
}

function Header() {
  return <h1 className={styles.header}>I love breathing!</h1>;
}

function AirPollution({ pm2_5 }) {
  let emoji;
  if (pm2_5 < 5) emoji = "🙂";
  else if (pm2_5 < 10) emoji = "😐";
  else if (pm2_5 < 15) emoji = "😕";
  else if (pm2_5 < 25) emoji = "🙁";
  else if (pm2_5 < 35) emoji = "😫";
  else if (pm2_5 < 50) emoji = "😭";
  else if (pm2_5 < 80) emoji = "🤢";
  else emoji = "💀";

  return (
    <p className={styles.pollutionInfo}>
      The pm2.5 is {pm2_5} in this area. {emoji}
    </p>
  );
}

function LocationSearch({ setCoordinates, setAirPollution }) {
  const [location, setLocation] = useState("");
  const [foundLocations, setFoundLocations] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    function () {
      setAirPollution("");
      setFoundLocations("");
      const controller = new AbortController();

      async function fetchLocation() {
        setError("");
        setIsLoading(true);
        try {
          const requestedLocation = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${location}&format=json`,
            { signal: controller.signal }
          );
          setFoundLocations(requestedLocation.data);
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
    [location, setAirPollution]
  );

  return (
    <div className={styles.geoSearchContainer}>
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Choose a location..."
        className={styles.input}
      ></input>
      {foundLocations && (
        <LocationDisplay
          foundLocations={foundLocations}
          setCoordinates={setCoordinates}
        />
      )}
      {isLoading && <Loader>Searching for locations...</Loader>}
      {error && <Error error={error} />}
    </div>
  );
}

function LocationDisplay({ foundLocations, setCoordinates }) {
  return (
    <ul className={styles.locations}>
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
    <li
      onClick={() => setCoordinates([location.lat, location.lon])}
      className={styles.location}
    >
      {display_name}
    </li>
  );
}

function Loader({ children }) {
  return <p className={styles.loader}>{children}</p>;
}

function Error({ error }) {
  return <p className={styles.error}>{error}</p>;
}

export default App;
