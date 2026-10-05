import { useState, useRef, useEffect } from "react";

export default function SearchBar({ onSearch, onSelect, currentCity }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const cities = await onSearch(v);
        setResults(cities);
        setOpen(cities.length > 0);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleSelect = (city) => { onSelect(city); setQuery(""); setResults([]); setOpen(false); };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-input-wrap">
        <span className="search-icon">{searching ? "⏳" : "🔍"}</span>
        <input
          type="text"
          placeholder={`Search city… (${currentCity.name})`}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((city, i) => (
            <li key={`${city.name}-${city.latitude}-${i}`} onClick={() => handleSelect(city)}>
              <strong>{city.name}</strong>
              {[city.admin1, city.country].filter(Boolean).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
