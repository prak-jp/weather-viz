import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet ko default icon fix (React ma broken hunxa)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Carto free raster tiles — no API key needed
const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

export default function MapView({ lat, lon, cityName }) {
  return (
    <div className="chart-card">
      <h3>📍 Location Map</h3>
      <MapContainer
        center={[lat, lon]}
        zoom={10}
        style={{ height: "300px", borderRadius: "12px" }}
      >
        <TileLayer
          url={tileUrl}       // 👈 yahaa use hunxa
          attribution='© <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={[lat, lon]}>
          <Popup>{cityName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}