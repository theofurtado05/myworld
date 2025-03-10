import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../index.css';

const MapComponent = ({ searchQuery, loading, setLoading, error, setError, currentUser }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [markedLocations, setMarkedLocations] = useState({});
  const [openMap, setOpenMap] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(null);

// Função para iniciar a rotação automática do globo
const startAutoRotate = () => {
    if (rotationInterval) return; // Evita múltiplas execuções
    
    const interval = setInterval(() => {
        if (map.current) {
            map.current.rotateTo((map.current.getBearing() + 0.5) % 360, {
                duration: 5000, // 5 segundos para transição suave
                easing: (t) => t, // Movimento linear
            });
        }
    }, 5000); // Atualiza a rotação a cada 5s

    setRotationInterval(interval);
};

// Função para parar a rotação automática
const stopAutoRotate = () => {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        setRotationInterval(null);
    }
};

useEffect(() => {
    if (map.current) {
        // Inicia rotação quando o mapa carregar
        startAutoRotate();

        // Parar rotação quando houver interação do usuário
        const stopOnInteraction = () => {
            stopAutoRotate();
            // Reinicia a rotação após 10 segundos sem interação
            setTimeout(() => {
                startAutoRotate();
            }, 10000);
        };

        // map.current.on("mousedown", stopOnInteraction);
        // map.current.on("wheel", stopOnInteraction);
        map.current.on("touchstart", stopOnInteraction);
    }

    return () => {
        stopAutoRotate(); // Limpa o intervalo ao desmontar o componente
    };
}, []);
  
  // Referência para o unsubscribe da snapshot do Firestore
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setOpenMap(true);
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`,
      zoom: 2,
      center: [-55, -15],
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
      setupMarkedLocationsLayer();
    });

    return () => {
      // Limpar o listener do Firestore
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      map.current.remove();
    };
  }, []);

  // Atualizar os locais marcados quando o usuário muda
  useEffect(() => {
    if (currentUser && map.current) {
      // Cancelar qualquer listener anterior
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Carregar os locais marcados do usuário
      loadUserMarkedLocations();
    } else {
      // Se não há usuário, limpar os locais marcados
      setMarkedLocations({});
      updateMarkedLocationsLayer({});
    }
  }, [currentUser]);

  // Função para carregar os locais marcados do usuário do Firestore
  const loadUserMarkedLocations = async () => {
    if (!currentUser) return;

    try {
        const userLocationsRef = collection(db, 'users', currentUser.uid, 'markedLocations');
        
        const unsubscribe = onSnapshot(userLocationsRef, (snapshot) => {
            const locationsData = {};
            snapshot.forEach((doc) => {
                let data = doc.data();
                
                // 🛠️ Converter `geojson` de string para objeto antes de atualizar o estado
                if (data.geojson && typeof data.geojson === "string") {
                    try {
                        data.geojson = JSON.parse(data.geojson);
                    } catch (error) {
                        console.error("Erro ao converter geojson:", error);
                    }
                }

                locationsData[doc.id] = data;
            });

            setMarkedLocations(locationsData);
            updateMarkedLocationsLayer(locationsData);
        });

        unsubscribeRef.current = unsubscribe;
    } catch (error) {
        console.error('Erro ao carregar locais marcados:', error);
    }
};

  // Funções de configuração do mapa (sem alterações)
  const setupMarkedLocationsLayer = () => {
    map.current.addSource('marked-locations', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.current.addLayer({
      id: 'marked-locations-fill',
      type: 'fill',
      source: 'marked-locations',
      paint: {
        'fill-color': 'rgba(0, 255, 0, 0.4)',
        'fill-outline-color': 'rgba(0, 180, 0, 0.8)'
      }
    });
  };

  const setupMapLayers = () => {
    // (Código existente mantido sem alterações)
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
    // (Código existente mantido sem alterações)
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&polygon_geojson=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          name: result.display_name,
          type: result.type,
          country: result.address.country || result.display_name,
          countryCode: result.address.country_code?.toUpperCase() || '',
          geojson: result.geojson || null,
          osmId: result.osm_id,
          osmType: result.osm_type,
          timestamp: new Date().toISOString() // Adicionar timestamp para ordenação
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

  // Função para marcar uma localidade e salvar no Firestore
  const markLocation = async (location) => {
    if (!currentUser) {
        alert("Você precisa fazer login para salvar locais!");
        return false;
    }

    try {
        // Se não temos o GeoJSON, precisamos buscá-lo
        if (!location.geojson) {
            const osmType = location.osmType === 'relation' ? 'R' :
                location.osmType === 'way' ? 'W' : 'N';

            const response = await fetch(
                `https://nominatim.openstreetmap.org/details.php?osmtype=${osmType}&osmid=${location.osmId}&class=${location.type}&format=json&polygon_geojson=1`
            );

            const data = await response.json();
            if (data && data.geometry) {
                location.geojson = data.geometry;
            }
        }

        // 🛠️ Verificar se geojson é válido antes de salvar
        if (!location.geojson || !location.geojson.type || !location.geojson.coordinates) {
            console.error("GeoJSON inválido, não salvando:", location.geojson);
            return false;
        }

        // ✅ Transformar `geojson` em string antes de salvar no Firestore
        const locationData = {
            ...location,
            geojson: JSON.stringify(location.geojson),
            timestamp: new Date().toISOString(), // Adiciona um timestamp para ordenação
        };

        const locationRef = doc(db, 'users', currentUser.uid, 'markedLocations', location.osmId.toString());
        await setDoc(locationRef, locationData);

        // Atualizar estado local
        const newMarkedLocations = { ...markedLocations };
        newMarkedLocations[location.osmId] = locationData;
        setMarkedLocations(newMarkedLocations);

        // Atualizar camada no mapa
        updateMarkedLocationsLayer(newMarkedLocations);

        return true;
    } catch (error) {
        console.error('Erro ao marcar localidade:', error);
        return false;
    }
};


  // Função para desmarcar uma localidade e remover do Firestore
  const unmarkLocation = async (location) => {
    if (!currentUser) return;
    
    try {
      // Atualizar o estado local
      const newMarkedLocations = { ...markedLocations };
      delete newMarkedLocations[location.osmId];
      setMarkedLocations(newMarkedLocations);
      
      // Atualizar a camada no mapa
      updateMarkedLocationsLayer(newMarkedLocations);
      
      // Remover do Firestore
      const locationRef = doc(db, 'users', currentUser.uid, 'markedLocations', location.osmId.toString());
      await setDoc(locationRef, { deleted: true }, { merge: true });
    } catch (error) {
      console.error('Erro ao desmarcar localidade:', error);
    }
  };

  // Função para atualizar a camada de localidades marcadas
  const updateMarkedLocationsLayer = (locationsObj) => {
    if (!map.current || !map.current.getSource('marked-locations')) return;

    const features = [];

    Object.values(locationsObj).forEach(location => {
        if (location.geojson && !location.deleted) {
            try {
                features.push({
                    type: 'Feature',
                    geometry: location.geojson, // 🚀 Certifique-se de que o geojson está formatado corretamente
                    properties: {
                        name: location.name,
                        id: location.osmId
                    }
                });
            } catch (error) {
                console.error("Erro ao adicionar feature no mapa:", error);
            }
        }
    });

    // 🚀 Atualizar a fonte de dados do mapa
    map.current.getSource('marked-locations').setData({
        type: 'FeatureCollection',
        features: features
    });
};


  // Função para adicionar um marcador no mapa
  const addMarker = (location) => {
    if (currentMarker) {
      currentMarker.remove();
    }

    // Criar elemento para o marcador
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
    
    // Verificar se a localidade está marcada
    const isMarked = location.osmId && markedLocations && markedLocations[location.osmId] && !markedLocations[location.osmId].deleted;
    
    // Texto adicional para usuários não logados
    const loginText = !currentUser ? 
      '<div class="text-sm text-red-500 my-2">Faça login para salvar locais</div>' : '';
    
    // Criar popup com botões de marcar/desmarcar
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true
    }).setHTML(`
      <div class="marker-popup">
        <div class="marker-popup-header">
          <strong>${isCountry ? 'País' : 'Local'}:</strong> ${location.country}
          ${location.countryCode ? `<br><strong>Código:</strong> ${location.countryCode}` : ''}
        </div>
        ${loginText}
        <div class="marker-popup-actions">
          <button id="btn-mark" class="popup-btn ${isMarked ? 'hidden' : ''}" style="background-color: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Marcar</button>
          <button id="btn-unmark" class="popup-btn ${!isMarked ? 'hidden' : ''}" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Desmarcar</button>
        </div>
      </div>
    `);

    // Criar o marcador
    const marker = new maplibregl.Marker(el)
      .setLngLat([location.lon, location.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    // Mostrar o popup ao adicionar o marcador
    marker.togglePopup();
    
    // Adicionar eventos aos botões
    setTimeout(() => {
      const btnMark = document.getElementById('btn-mark');
      const btnUnmark = document.getElementById('btn-unmark');
      
      if (btnMark) {
        btnMark.addEventListener('click', async () => {
          const success = await markLocation(location);
          if (success) {
            btnMark.classList.add('hidden');
            btnUnmark.classList.remove('hidden');
          }
        });
      }
      
      if (btnUnmark) {
        btnUnmark.addEventListener('click', async () => {
          await unmarkLocation(location);
          btnUnmark.classList.add('hidden');
          btnMark.classList.remove('hidden');
        });
      }
    }, 100);
    
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

  // Expor a função de busca globalmente
  useEffect(() => {
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
    
    return () => {
      if (window) {
        window.searchLocationFromMap = null;
      }
    };
  }, [markedLocations, currentUser]);

  return (
    <>
      <div ref={mapContainer} className="h-full w-full" style={{marginTop:'-30px !important'}} />
      <style jsx>{`
        .hidden {
          display: none;
        }
        .marker-popup {
          padding: 5px;
        }
        .marker-popup-header {
          margin-bottom: 10px;
        }
        .marker-popup-actions {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </>
  );
};

export default MapComponent;