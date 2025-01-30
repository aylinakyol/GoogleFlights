import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './FlightSearchComponent.css';

const FlightSearchComponent = () => {
  // Default Airports
  const DEFAULT_AIRPORTS = [
    {
      skyId: "NYCA",
      entityId: "27537542",
      presentation: {
        title: "New York",
        suggestionTitle: "New York (Any)",
        subtitle: "United States"
      }
    },
    {
      skyId: "LOND",
      entityId: "27544008",
      presentation: {
        title: "London",
        suggestionTitle: "London (Any)",
        subtitle: "United Kingdom"
      }
    },
    {
      skyId: "TOKJ",
      entityId: "27544100",
      presentation: {
        title: "Tokyo",
        suggestionTitle: "Tokyo (Any)",
        subtitle: "Japan"
      }
    },
    {
      skyId: "DXBA",
      entityId: "27544300",
      presentation: {
        title: "Dubai",
        suggestionTitle: "Dubai (Any)",
        subtitle: "United Arab Emirates"
      }
    },
    {
      skyId: "SYDA",
      entityId: "27544200",
      presentation: {
        title: "Sydney",
        suggestionTitle: "Sydney (Any)",
        subtitle: "Australia"
      }
    }
  ];

  // API Configuration
  const API_CONFIG = {
    BASE_URL: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights',
    HEADERS: {
      'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com',
      'x-rapidapi-key': '73add6c5f4mshcf6fc1c67eb989ep122108jsn920aa8419766'
    }
  };

  // State Management
  const [searchParams, setSearchParams] = useState({
    originSkyId: DEFAULT_AIRPORTS[0].skyId,
    destinationSkyId: DEFAULT_AIRPORTS[1].skyId,
    originEntityId: DEFAULT_AIRPORTS[0].entityId,
    destinationEntityId: DEFAULT_AIRPORTS[1].entityId,
    date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    adults: 1,
    cabinClass: 'economy',
    sortBy: 'best',
    children: 0,
    currency: 'USD',
    market: 'en-US',
    countryCode: 'US'
  });

  // State declarations
  const [originSearch, setOriginSearch] = useState(DEFAULT_AIRPORTS[0].presentation.title);
  const [destinationSearch, setDestinationSearch] = useState(DEFAULT_AIRPORTS[1].presentation.title);
  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);
  const [searchResponse, setSearchResponse] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Airport Search Function
  const searchAirports = useCallback(
    debounce(async (query, type) => {
      if (!query || query.trim().length < 2) {
        type === 'origin' ? setOriginResults([]) : setDestinationResults([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_CONFIG.BASE_URL}/searchAirport`,
          {
            params: { query },
            headers: API_CONFIG.HEADERS
          }
        );

        const results = response.data.data || [];
        const combinedResults = [
          ...DEFAULT_AIRPORTS.filter(airport =>
            airport.presentation.title.toLowerCase().includes(query.toLowerCase())
          ),
          ...results.filter(result =>
            !DEFAULT_AIRPORTS.some(def => def.skyId === result.skyId)
          )
        ];

        if (type === 'origin') {
          setOriginResults(combinedResults);
        } else {
          setDestinationResults(combinedResults);
        }
      } catch (error) {
        console.error('Airport Search Error:', error);
        setError('Airport search failed');
      }
    }, 500),
    []
  );

  // Airport Selection Functions
  const selectOriginAirport = (airport) => {
    setSearchParams(prev => ({
      ...prev,
      originSkyId: airport.skyId,
      originEntityId: airport.entityId
    }));
    setOriginSearch(airport.presentation.title);
    setOriginResults([]);
  };

  const selectDestinationAirport = (airport) => {
    setSearchParams(prev => ({
      ...prev,
      destinationSkyId: airport.skyId,
      destinationEntityId: airport.entityId
    }));
    setDestinationSearch(airport.presentation.title);
    setDestinationResults([]);
  };

  // Flight Search Function
  const searchFlights = useCallback(async () => {
    const validateSearch = () => {
      const errors = [];
      if (!searchParams.originSkyId) errors.push('Departure airport required');
      if (!searchParams.destinationSkyId) errors.push('Arrival airport required');
      if (!searchParams.date) errors.push('Date required');
      return errors;
    };

    const validationErrors = validateSearch();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/searchFlights`,
        {
          params: searchParams,
          headers: API_CONFIG.HEADERS
        }
      );

      setSearchResponse(response.data);
      
      if (response.data.itineraries && response.data.itineraries.length > 0) {
        setFlights(response.data.itineraries);
      } else {
        setFlights([]);
      }
    } catch (error) {
      console.error('Flight Search Error:', error);
      setError('Flight search failed');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Initial load check
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    }
  }, [isInitialMount]);

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOriginSearchChange = (e) => {
    const value = e.target.value;
    setOriginSearch(value);
    if (value.length >= 2) {
      searchAirports(value, 'origin');
    } else {
      setOriginResults([]);
    }
  };

  const handleDestinationSearchChange = (e) => {
    const value = e.target.value;
    setDestinationSearch(value);
    if (value.length >= 2) {
      searchAirports(value, 'destination');
    } else {
      setDestinationResults([]);
    }
  };

  // Manual search handler
  const handleSearch = () => {
    if (!loading) {
      searchFlights();
    }
  };

  return (
    <div className="flight-search-container">
      <h2>Flight Search</h2>

      {/* Departure Airport Search */}
      <div className="airport-search">
        <input
          type="text"
          placeholder="Departure Airport"
          value={originSearch}
          onChange={handleOriginSearchChange}
        />
        {originResults.length > 0 && (
          <div className="airport-suggestions">
            {originResults.map(airport => (
              <div 
                key={airport.skyId}
                onClick={() => selectOriginAirport(airport)}
                className="suggestion-item"
              >
                {airport.presentation.title} ({airport.skyId})
                <span className="subtitle">{airport.presentation.subtitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Arrival Airport Search */}
      <div className="airport-search">
        <input
          type="text"
          placeholder="Arrival Airport"
          value={destinationSearch}
          onChange={handleDestinationSearchChange}
        />
        {destinationResults.length > 0 && (
          <div className="airport-suggestions">
            {destinationResults.map(airport => (
              <div 
                key={airport.skyId}
                onClick={() => selectDestinationAirport(airport)}
                className="suggestion-item"
              >
                {airport.presentation.title} ({airport.skyId})
                <span className="subtitle">{airport.presentation.subtitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div>
        <input
          type="date"
          name="date"
          value={searchParams.date}
          onChange={handleInputChange}
        />
      </div>

      {/* Optional Parameters */}
      <div className="optional-params">
        <select
          name="adults"
          value={searchParams.adults}
          onChange={handleInputChange}
        >
          {[1,2,3,4,5].map(num => (
            <option key={num} value={num}>
              {num} Adult{num > 1 ? 's' : ''}
            </option>
          ))}
        </select>

        <select
          name="children"
          value={searchParams.children}
          onChange={handleInputChange}
        >
          {[0,1,2,3].map(num => (
            <option key={num} value={num}>
              {num} Child{num !== 1 ? 'ren' : ''}
            </option>
          ))}
        </select>

        <select
          name="cabinClass"
          value={searchParams.cabinClass}
          onChange={handleInputChange}
        >
          <option value="economy">Economy</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </div>

      {/* Search Button */}
      <button 
        onClick={handleSearch}
        disabled={loading}
        className="search-button"
      >
        {loading ? 'Searching...' : 'Search Flights'}
      </button>

      {/* Error Display */}
      {error && <div className="error-message">{error}</div>}

      {/* Flight Results */}
      {flights.length > 0 && (
        <div className="flight-results">
          <h3>Flight Results ({flights.length} flights)</h3>
          {flights.map((flight, index) => (
            <div key={index} className="flight-card">
              <div className="flight-details">
                <div className="price">Price: {flight.price || 'Not specified'}</div>
                <div className="airline">Airline: {flight.carrier || 'Not specified'}</div>
                <div className="times">
                  <span>Departure: {flight.departureTime || 'Not specified'}</span>
                  <span>Arrival: {flight.arrivalTime || 'Not specified'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Development Environment Raw Data Display */}
      {process.env.NODE_ENV === 'development' && (
        <details>
          <summary>Debug: Raw API Response</summary>
          <pre>{JSON.stringify(searchResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default FlightSearchComponent;