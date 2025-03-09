import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../index.css'

const Map = ({ searchQuery, loading, setLoading, error, setError }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentMarker, setCurrentMarker] = useState(null);

  useEffect(() => {
    console.log("Map: ", map)

    if (map.current) return; // initialize map only once

    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: '/style.json',
      zoom: 2,
      center: [-55, -15], // Vista global para facilitar a busca de qualquer país
      canvasContextAttributes: {antialias: true}
    });

    map.current.on('style.load', () => {
      map.current.setProjection({
        type: 'globe'
      });
    });

    map.current.on('load', () => {
      setupMapLayers();
      setupMapEvents();
    });

    return () => map.current.remove();
  }, []);

  const setupMapLayers = () => {
    // Adicionar fonte de dados para países
    map.current.addSource('countries', {
      'type': 'vector',
      'url': 'https://studio.mapbox.com/tilesets/mapbox.country-boundaries-v1'
    });

    // Adicionar camada para países (cinza)
    map.current.addLayer({
      'id': 'countries-fill',
      'type': 'fill',
      'source': 'countries',
      'source-layer': 'country_boundaries',
      'paint': {
        'fill-color': 'rgba(128, 128, 128, 0.5)', // Cinza
        'fill-outline-color': 'rgba(100, 100, 100, 1)'
      }
    });

    // Adicionar camada para países (contorno)
    map.current.addLayer({
      'id': 'countries-outline',
      'type': 'line',
      'source': 'countries',
      'source-layer': 'country_boundaries',
      'paint': {
        'line-color': 'rgba(60, 60, 60, 1)',
        'line-width': 0.8
      }
    });

    // Adicionar fonte de dados para estados/províncias
    map.current.addSource('admin1', {
      'type': 'vector',
      'url': 'https://studio.mapbox.com/tilesets/mapbox.boundaries-adm1-v3'
    });

    // Adicionar camada para estados/províncias do Brasil
    map.current.addLayer({
      'id': 'admin1-fill',
      'type': 'fill',
      'source': 'admin1',
      'source-layer': 'boundaries_admin_1',
      'paint': {
        'fill-color': 'rgba(216, 170, 230, 0.6)',
        'fill-outline-color': 'rgba(148, 0, 211, 0.8)'
      },
      'filter': ['==', ['get', 'iso_3166_1'], 'BR']
    });

    // Adicionar bordas dos estados para melhor visualização
    map.current.addLayer({
      'id': 'admin1-borders',
      'type': 'line',
      'source': 'admin1',
      'source-layer': 'boundaries_admin_1',
      'paint': {
        'line-color': 'rgba(148, 0, 211, 0.8)',
        'line-width': 0.5
      },
      'filter': ['==', ['get', 'iso_3166_1'], 'BR']
    });

    // Adicionar fonte de dados para municípios (cidades) do Brasil
    map.current.addSource('admin2', {
      'type': 'vector',
      'url': 'https://studio.mapbox.com/tilesets/mapbox.boundaries-adm2-v3'
    });

    // Adicionar camada para municípios do Brasil
    map.current.addLayer({
      'id': 'admin2-fill',
      'type': 'fill',
      'source': 'admin2',
      'source-layer': 'boundaries_admin_2',
      'paint': {
        'fill-color': 'rgba(144, 238, 144, 0.6)', // Verde claro
        'fill-outline-color': 'rgba(34, 139, 34, 0.8)' // Verde escuro
      },
      'filter': ['==', ['get', 'iso_3166_1'], 'BR']
    });

    // Adicionar bordas dos municípios para melhor visualização
    map.current.addLayer({
      'id': 'admin2-borders',
      'type': 'line',
      'source': 'admin2',
      'source-layer': 'boundaries_admin_2',
      'paint': {
        'line-color': 'rgba(34, 139, 34, 0.6)', // Verde escuro
        'line-width': 0.3
      },
      'filter': ['==', ['get', 'iso_3166_1'], 'BR'],
      'minzoom': 5 // Mostrar apenas quando der zoom suficiente
    });
  };

  const setupMapEvents = () => {
    // Evento para países
    map.current.on('click', 'countries-fill', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const countryName = feature.properties.name_en || feature.properties.name;
        const countryCode = feature.properties.iso_3166_1;
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>País:</strong> ${countryName} (${countryCode})`)
          .addTo(map.current);
      }
    });
    
    // Evento para municípios
    map.current.on('click', 'admin2-fill', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>Município:</strong> ${feature.properties.name}`)
          .addTo(map.current);
      }
    });
    
    // Mudar o cursor ao passar por cima de um país ou município
    map.current.on('mouseenter', 'countries-fill', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'countries-fill', () => {
      map.current.getCanvas().style.cursor = '';
    });
    
    map.current.on('mouseenter', 'admin2-fill', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'admin2-fill', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Função para buscar localização usando OpenStreetMap Nominatim API
  const searchLocation = async (query) => {
    setLoading(true);
    setError(false);
    
    try {
      // Especificar o nível de detalhe na busca (continent, country, state, city)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        // Tentativa de obter informações sobre país
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          name: result.display_name,
          type: result.type,
          country: result.address.country || result.display_name,
          countryCode: result.address.country_code?.toUpperCase() || ''
        };
        
        setLoading(false);
        return location;
      }
      
      setError(true);
      setLoading(false);
      return null;
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      setError(true);
      setLoading(false);
      return null;
    }
  };

  // Função para adicionar um marcador no mapa
  const addMarker = (location) => {
    if (currentMarker) {
      currentMarker.remove();
    }

    // Usar o componente CustomMarker
    const el = document.createElement('div');
    el.className = 'marker';
    
    // Cor diferente se for país
    const isCountry = location.type === 'country' || location.type === 'administrative';
    const color = isCountry ? '#3498db' : '#e74c3c';
    
    el.style.backgroundColor = color;
    el.style.width = isCountry ? '20px' : '15px';
    el.style.height = isCountry ? '20px' : '15px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
    
    const marker = new maplibregl.Marker(el)
      .setLngLat([location.lon, location.lat])
      .setPopup(
        new maplibregl.Popup().setHTML(`
          <strong>${isCountry ? 'País' : 'Local'}:</strong> ${location.country}
          ${location.countryCode ? `<br><strong>Código:</strong> ${location.countryCode}` : ''}
        `)
      )
      .addTo(map.current);
    
    setCurrentMarker(marker);

    // Ajustar o zoom dependendo se é país ou cidade
    const zoomLevel = isCountry ? 4 : 10;

    map.current.flyTo({
      center: [location.lon, location.lat],
      zoom: zoomLevel,
      speed: 1.5,
      curve: 1.5
    });
  };

  // Expor a função de busca
  React.useEffect(() => {
    if (window) {
      window.searchLocationFromMap = async (query) => {
        const location = await searchLocation(query);
        if (location) {
          addMarker(location);
          return location;
        }
        return null;
      };
    }
  }, []);

  return (
    <>
        <div style={{
            zIndex: 999,
            }} ref={mapContainer} className="h-full w-full max-w-4xl max-h-600"/>
    </>
  );
};

export default Map;