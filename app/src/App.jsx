import React, { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const App = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [clickedCountries, setClickedCountries] = useState([]);
  const [zoom, setZoom] = useState(1.5);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.js';
    script.async = true;
    script.onload = initializeMap;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@5.2.0/dist/maplibre-gl.css';
    document.head.appendChild(link);

    function initializeMap() {
      if (mapRef.current) return;

      const maplibregl = window.maplibregl;
      if (!maplibregl) {
        console.error('MapLibre não foi carregado corretamente');
        return;
      }

      const map = new maplibregl.Map({
        container: mapContainer.current,
        zoom: zoom,
        minZoom: 1, // Zoom mínimo para sempre ver o globo
        maxZoom: 20, // Sem limite para zoom aproximado
        center: [0, 20],
        style: {
          version: 8,
          projection: { type: 'globe' },
          sources: {
            countries: {
              type: 'geojson',
              data: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
            },
            // Fonte para estados brasileiros
            brazilStates: {
              type: 'geojson',
              data: 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'
            },
            // Fonte para estados globais
            globalStates: {
              type: 'vector',
              url: 'https://studio.mapbox.com/tilesets/mapbox.boundaries-adm1-v3'
            },
            // Cidades do mundo
            cities: {
              type: 'geojson',
              data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_populated_places.geojson'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: { 
                'background-color': 'rgba(255, 255, 255, 0.9)'
              }
            },
            {
              id: 'countries-fill',
              type: 'fill',
              source: 'countries',
              paint: {
                'fill-color': '#e0e0e0',
                'fill-outline-color': '#cccccc',
                'fill-opacity': 0.8
              }
            },
            {
              id: 'countries-border',
              type: 'line',
              source: 'countries',
              paint: {
                'line-color': '#aaaaaa',
                'line-width': 0.5,
                'line-opacity': 0.8
              }
            },
            {
              id: 'brazil-states-fill',
              type: 'fill',
              source: 'brazilStates',
              paint: {
                'fill-color': '#e0e0e0',
                'fill-outline-color': '#d0d0d0',
                'fill-opacity': 0
              },
              minzoom: 4
            },
            {
              id: 'brazil-states-border',
              type: 'line',
              source: 'brazilStates',
              paint: {
                'line-color': '#bbbbbb',
                'line-width': 0.3,
                'line-opacity': 0
              },
              minzoom: 4
            },
            {
              id: 'cities-points',
              type: 'circle',
              source: 'cities',
              paint: {
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  5, 1,
                  8, 2,
                  10, 3
                ],
                'circle-color': '#999999',
                'circle-opacity': 0
              },
              minzoom: 5
            }
          ],
          fog: {
            'range': [0.8, 1.2],
            'color': 'white',
            'horizon-blend': 0.15
          }
        }
      });

      map.on('load', () => {
        console.log('Map loaded');

        if (map.getLayer('background')) {
          map.setPaintProperty('background', 'background-color', 'rgba(255, 255, 255, 0.9)');
        }

        // Carrega os estados brasileiros via API quando necessário
        map.on('zoom', () => {
          const currentZoom = map.getZoom();
          setZoom(currentZoom);
          
          // Mostra estados quando zoom > 4
          if (currentZoom > 4) {
            map.setPaintProperty('brazil-states-fill', 'fill-opacity', 0);
            map.setPaintProperty('brazil-states-border', 'line-opacity', 0.8);
            
            // Verifica se o Brasil está no centro da visualização
            const center = map.getCenter();
            if (center.lng > -75 && center.lng < -30 && center.lat > -35 && center.lat < 5) {
              // Está sobre o Brasil, carrega estados se necessário
              if (!map.getSource('brazil-states-detailed')) {
                fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson')
                  .then(response => response.json())
                  .then(data => {
                    // Adiciona a fonte se não existir
                    if (!map.getSource('brazil-states-detailed')) {
                      map.addSource('brazil-states-detailed', {
                        type: 'geojson',
                        data: data
                      });
                      
                      // Adiciona camada de preenchimento dos estados
                      map.addLayer({
                        id: 'brazil-states-detailed-fill',
                        type: 'fill',
                        source: 'brazil-states-detailed',
                        paint: {
                          'fill-color': '#e0e0e0',
                          'fill-opacity': 0.01
                        }
                      });
                      
                      // Adiciona camada de borda dos estados
                      map.addLayer({
                        id: 'brazil-states-detailed-border',
                        type: 'line',
                        source: 'brazil-states-detailed',
                        paint: {
                          'line-color': '#999999',
                          'line-width': 0.5,
                          'line-opacity': 0.8
                        }
                      });
                    }
                  })
                  .catch(error => {
                    console.error('Erro ao carregar estados do Brasil:', error);
                  });
              }
            }
          } else {
            // Esconde estados em zoom baixo
            map.setPaintProperty('brazil-states-border', 'line-opacity', 0);
            
            // Esconde as camadas detalhadas se existirem
            if (map.getLayer('brazil-states-detailed-fill')) {
              map.setPaintProperty('brazil-states-detailed-fill', 'fill-opacity', 0);
            }
            
            if (map.getLayer('brazil-states-detailed-border')) {
              map.setPaintProperty('brazil-states-detailed-border', 'line-opacity', 0);
            }
          }
          
          // Mostrar cidades quando zoom > 5
          if (currentZoom > 5) {
            map.setPaintProperty('cities-points', 'circle-opacity', 0.8);
            
            // Carrega dados adicionais de estados para outros países
            // Isso é personalizado para cada região do globo
            const bounds = map.getBounds();
            const visibleCountries = getVisibleCountries(bounds);
            
            // Carrega estados para os países visíveis
            visibleCountries.forEach(country => {
              loadCountryStates(map, country);
            });
          } else {
            map.setPaintProperty('cities-points', 'circle-opacity', 0);
          }
        });

        // Configuração para evitar fundo preto em qualquer situação
        map.scrollZoom.setWheelZoomRate(0.04); // Zoom mais suave
        
        // Adiciona controle de navegação ao mapa
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Configura o mapa para manter o fundo branco/transparente
        map.on('moveend', () => {
          const canvas = map.getCanvas();
          canvas.style.background = "white";
        });

        // Interação com o mapa
        map.on('click', 'countries-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const countryId = feature.properties.ISO_A3 || feature.id;
            const countryName = feature.properties.ADMIN || feature.properties.name;
            
            console.log(`Clicou em: ${countryName}`);
            
            setClickedCountries((prev) => {
              const index = prev.findIndex(c => c.id === countryId);
              if (index >= 0) {
                return prev.filter(c => c.id !== countryId);
              } else {
                return [...prev, { id: countryId, name: countryName }];
              }
            });
            
            // Centraliza no país clicado
            if (feature.geometry) {
              const bounds = getBoundsFromFeature(feature);
              map.fitBounds(bounds, { padding: 20 });
            }
          }
        });

        // Cursor pointer ao passar sobre países
        map.on('mouseenter', 'countries-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'countries-fill', () => {
          map.getCanvas().style.cursor = '';
        });

        mapRef.current = map;
      });
    }

    // Função para obter países visíveis na tela
    function getVisibleCountries(bounds) {
      // Implementação simplificada - em produção, isso seria mais sofisticado
      const visibleCountries = [];
      
      // Verifica se o Brasil está visível
      if (bounds.contains([-50, -15])) {
        visibleCountries.push('Brazil');
      }
      
      // Adicione mais países conforme necessário
      return visibleCountries;
    }
    
    // Função para carregar dados dos estados de um país específico
    function loadCountryStates(map, countryName) {
      let url = '';
      let sourceId = '';
      
      switch (countryName) {
        case 'Brazil':
          url = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson';
          sourceId = 'brazil-states-detailed';
          break;
        // Adicione mais países conforme necessário
        default:
          return;
      }
      
      if (!map.getSource(sourceId)) {
        fetch(url)
          .then(response => response.json())
          .then(data => {
            map.addSource(sourceId, {
              type: 'geojson',
              data: data
            });
            
            const fillId = `${sourceId}-fill`;
            const borderId = `${sourceId}-border`;
            
            map.addLayer({
              id: fillId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': '#e0e0e0',
                'fill-opacity': 0.01
              }
            });
            
            map.addLayer({
              id: borderId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': '#999999',
                'line-width': 0.5,
                'line-opacity': 0.8
              }
            });
          })
          .catch(error => {
            console.error(`Erro ao carregar estados de ${countryName}:`, error);
          });
      }
    }
    
    // Função para calcular bounds de um feature
    function getBoundsFromFeature(feature) {
      const coordinates = getAllCoordinates(feature.geometry);
      
      if (coordinates.length === 0) {
        return new maplibregl.LngLatBounds([-180, -90], [180, 90]);
      }
      
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      
      return bounds;
    }
    
    // Função para extrair todas as coordenadas de uma geometria
    function getAllCoordinates(geometry) {
      const coordinates = [];
      
      if (!geometry) return coordinates;
      
      if (geometry.type === 'Point') {
        coordinates.push(geometry.coordinates);
      } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
        geometry.coordinates.forEach(coord => coordinates.push(coord));
      } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
        geometry.coordinates.forEach(ring => {
          ring.forEach(coord => coordinates.push(coord));
        });
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            ring.forEach(coord => coordinates.push(coord));
          });
        });
      }
      
      return coordinates;
    }

    return () => {
      if (script.parentNode) document.body.removeChild(script);
      if (link.parentNode) document.head.removeChild(link);
      
      // Limpa o mapa
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const clickedIds = clickedCountries.map(c => c.id);

    if (map.isStyleLoaded() && map.getLayer('countries-fill')) {
      try {
        map.setPaintProperty('countries-fill', 'fill-color', [
          'case',
          ['in', ['get', 'ISO_A3'], ['literal', clickedIds]],
          '#4CAF50', // Verde para países clicados
          '#e0e0e0'  // Cinza claro para países não clicados
        ]);
      } catch (error) {
        console.error('Erro ao atualizar as cores dos países:', error);
      }
    }
  }, [clickedCountries]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '80%', 
        height: '80%',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.1)',
        background: 'white' // Garante fundo branco
      }}>
        <div ref={mapContainer} style={{ 
          width: '100%', 
          height: '100%',
          background: 'white' // Garante fundo branco
        }} />
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '5px',
        fontSize: '12px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
      }}>
        Zoom: {zoom.toFixed(1)}x
        {zoom > 4 && <div>Estados visíveis</div>}
        {zoom > 5 && <div>Cidades visíveis</div>}
        {clickedCountries.length > 0 && (
          <div>
            <div>Países selecionados:</div>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {clickedCountries.map(country => (
                <li key={country.id}>{country.name || country.id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;