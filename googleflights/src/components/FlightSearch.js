import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const FlightSearchComponent = () => {
  // Varsayılan Havaalanları
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

  // API Konfigürasyonu
  const API_CONFIG = {
    BASE_URL: 'https://sky-scrapper.p.rapidapi.com/api/v1/flights',
    HEADERS: {
      'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com',
      'x-rapidapi-key': '73add6c5f4mshcf6fc1c67eb989ep122108jsn920aa8419766'
    }
  };

  // State Yönetimi
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

  // Arama state'leri
  const [originSearch, setOriginSearch] = useState(DEFAULT_AIRPORTS[0].presentation.title);
  const [destinationSearch, setDestinationSearch] = useState(DEFAULT_AIRPORTS[1].presentation.title);
  const [originResults, setOriginResults] = useState([]);
  const [destinationResults, setDestinationResults] = useState([]);

  // Sonuç state'leri
  const [searchResponse, setSearchResponse] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Havaalanı Arama Fonksiyonu
  const searchAirports = async (query, type) => {
    // Boş sorguları engelle
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

      // Sonuçları state'e aktar
      const results = response.data.data || [];
      
      // Varsayılan havaalanlarını da ekle
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
      setError('Havaalanı araması başarısız');
    }
  };

  // Havaalanı Seçim Fonksiyonları
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

  // Render Yardımcıları
  const renderSearchResults = () => {
    // Yanıt yoksa boş içerik
    return null;
  };

  // Uçuş Arama Fonksiyonu
  const searchFlights = useCallback(async () => {
    const validateSearch = () => {
      const errors = [];
      if (!searchParams.originSkyId) errors.push('Kalkış havaalanı gerekli');
      if (!searchParams.destinationSkyId) errors.push('Varış havaalanı gerekli');
      if (!searchParams.date) errors.push('Tarih gerekli');
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

      console.log('API Yanıtı:', response.data);
      
      // Tüm yanıtı state'e kaydet
      setSearchResponse(response.data);

      // Eğer itineraries varsa flights state'ini güncelle
      if (response.data.itineraries && response.data.itineraries.length > 0) {
        setFlights(response.data.itineraries);
      } else {
        setFlights([]);
      }
    } catch (error) {
      console.error('Uçuş Arama Hatası:', error);
      setError('Uçuş araması başarısız');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, [
    API_CONFIG.BASE_URL, 
    API_CONFIG.HEADERS, 
    searchParams
  ]);

  // İlk yüklemede uçuş araması
  useEffect(() => {
    searchFlights();
  }, [searchFlights]);

  // Input Değişim Handler'ları
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
    searchAirports(value, 'origin');
  };

  const handleDestinationSearchChange = (e) => {
    const value = e.target.value;
    setDestinationSearch(value);
    searchAirports(value, 'destination');
  };

  return (
    <div className="flight-search-container">
      <h2>Uçuş Arama</h2>

      {/* Kalkış Havaalanı Arama */}
      <div className="airport-search">
        <input
          type="text"
          placeholder="Kalkış Havaalanı"
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

      {/* Varış Havaalanı Arama */}
      <div className="airport-search">
        <input
          type="text"
          placeholder="Varış Havaalanı"
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

      {/* Tarih Seçimi */}
      <div>
        <input
          type="date"
          name="date"
          value={searchParams.date}
          onChange={handleInputChange}
        />
      </div>

      {/* Opsiyonel Parametreler */}
      <div className="optional-params">
        {/* Yetişkin Sayısı */}
        <select
          name="adults"
          value={searchParams.adults}
          onChange={handleInputChange}
        >
          {[1,2,3,4,5].map(num => (
            <option key={num} value={num}>
              {num} Yetişkin
            </option>
          ))}
        </select>

        {/* Çocuk Sayısı */}
        <select
          name="children"
          value={searchParams.children}
          onChange={handleInputChange}
        >
          {[0,1,2,3].map(num => (
            <option key={num} value={num}>
              {num} Çocuk
            </option>
          ))}
        </select>

        {/* Kabin Sınıfı */}
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

      {/* Arama Butonu */}
      <button 
        onClick={searchFlights}
        disabled={loading}
        className="search-button"
      >
        {loading ? 'Aranıyor...' : 'Uçuş Ara'}
      </button>

      {/* Hata Gösterimi */}
      {error && <div className="error-message">{error}</div>}

      {/* Arama Sonuçları */}
      {renderSearchResults()}

      {/* Uçuş Sonuçları */}
      {flights.length > 0 && (
        <div className="flight-results">
          <h3>Uçuş Sonuçları ({flights.length} uçuş)</h3>
          {flights.map((flight, index) => (
            <div key={index} className="flight-card">
              <div className="flight-details">
                <div className="price">Fiyat: {flight.price || 'Belirtilmemiş'}</div>
                <div className="airline">Havayolu: {flight.carrier || 'Belirtilmemiş'}</div>
                <div className="times">
                  <span>Kalkış: {flight.departureTime || 'Belirtilmemiş'}</span>
                  <span>Varış: {flight.arrivalTime || 'Belirtilmemiş'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Geliştirme Ortamında Ham Veri Gösterimi */}
      {process.env.NODE_ENV === 'development' && (
        <details>
          <summary>Hata Ayıklama: Ham API Yanıtı</summary>
          <pre>{JSON.stringify(searchResponse, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default FlightSearchComponent;