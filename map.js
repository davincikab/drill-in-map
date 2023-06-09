mapboxgl.accessToken = 'pk.eyJ1IjoiZmFsY29uc2NsdWIiLCJhIjoiY2xlaWt4YnBkMDJmaTN5cXNoNDR1NG9oMiJ9.CO9L_QlS3DETwe5UZXj_Ew';

const map = new mapboxgl.Map({
    container: 'map',
    center: [2.3074205413575726, 27.31185379940868],
    style:'mapbox://styles/falconsclub/clibhii0802zd01pgfw5r7xor',
    zoom: 1.6 // set the initial zoom level
});

const views = {
    global:true,
    continent:false,
    country:false,
}

let hoveredPolygonId = null;
const popup = new mapboxgl.Popup();

map.on('load', () => {
    map.addSource('continents', {
        type:'geojson',
        data:'/data/continents.json'
    });

    map.addLayer({
        id:'continents',
        type:'fill',
        source:'continents',
        paint:{
            'fill-color':'transparent',
            'fill-opacity':1
        }
    });

    map.addLayer({
      id:'continents-highlight',
      type:'fill',
      source:'continents',
      filter:['==', 'name', "ugans"],
      paint:{
        'fill-color':'#CEB06B',
        'fill-opacity':1
      }
    });

    map.addLayer({
      id:'continents-line',
      type:'line',
      source:'continents',
      filter:['==', 'name', "ugans"],
      paint:{
        'line-color':'#CEB06B',
        'line-width':2
      }
    });

    // countries layers
    map.addSource('country', {
      type:'geojson',
      data:'/data/countries_data.geojson',
      generateId:true
    });

    addLayer('countries');

    // map.on('mousemove', 'continents', (e) => {
    //     let feature = e.features[0];
    //     let name = feature.properties.name;

    //     map.setFilter('continents-highlight', ['==', 'name', `${name}`])
    //     map.getCanvas().style.cursor = "pointer";

    // });

    // map.on('mouseleave', 'continents', (e) => {
    //     map.setFilter('continents-highlight', ['==', 'name', ""]);
    //     map.getCanvas().style.cursor = "";
    // });

    map.on('mousemove', 'countries', (e) => {
        map.getCanvas().style.cursor = "pointer";

        if (e.features.length > 0) {
            console.log(e.features[0]);

            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'country', id: hoveredPolygonId },
                    { hover: false }
                );
            }

            hoveredPolygonId = e.features[0].id;

            map.setFeatureState(
                { source: 'country', id: hoveredPolygonId },
                { hover: true }
            );
        }
    });
   

    map.on('mouseleave', 'countries', () => {
        map.getCanvas().style.cursor = "";

        if (hoveredPolygonId !== null) {
            map.setFeatureState(
                { source: 'country', id: hoveredPolygonId },
                { hover: false }
            );
        }

        hoveredPolygonId = null;
    }); 


    //On click
    map.on('click', 'continents', (e) => {
        console.log(e.features);

        handleMouseClick(e.features[0]);       
    });

    map.on('click', 'countries', (e) => {
        console.log(e.features);
        handleMouseClick(e.features[0]);       
    });

    map.addControl(new mapboxgl.NavigationControl());
});


function updateMapFooter(name) {
  document.querySelector(".section-footer h1").innerHTML = name;
}

function handleMouseMove(feature) {
  map.getCanvas().style.cursor = "pointer";  
}

function handleMouseLeave(feature) {
  map.getCanvas().style.cursor = "";
}

function handleMouseClick(feature) {
    console.log(feature);

    let layer = feature.layer;
    var bbox = turf.bbox(turf.featureCollection([feature]));

    let [minX, minY, maxX, maxY] = bbox;
    map.fitBounds([[minX, minY], [maxX, maxY]], { padding:50 });


    updateMapFooter(feature.properties.name);

    // handle different layer
    if(layer.id != 'continents') {
        // check if country is USA/CANADA
        let name = feature.properties.name;
        map.setPaintProperty('countries', 'fill-color', [
            'match',
            ['get', 'name'],
            `${name}`,
            '#f3f4f4',
            '#333'
        ]);

        // addCountryPoints();
    } else {
        // add countries layers
        // addLayer('countries');

        // // remove continents data
        removeLayer('continents');
        removeLayer('continents-highlight');
    }
}

function addLayer(layerId) {
    switch(layerId) {
        case 'continents':
            map.addLayer({
                id:'continents',
                type:'fill',
                source:'continents',
                paint:{
                'fill-color':'transparent',
                'fill-opacity':1
                }
            });

            map.addLayer({
                id:'continents-highlight',
                type:'fill',
                source:'continents',
                filter:['==', 'name', "ugans"],
                paint:{
                'fill-color':'#CEB06B',
                'fill-opacity':1
                }
            });

            break;
        case 'countries':
            map.addLayer({
                id:'countries',
                type:'fill',
                source:'country',
                paint:{
                    'fill-color':'#333',
                    'fill-outline-color':'#fff',
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'hover'], false],
                        1,
                        0.5
                    ]
                }
            });

            // map.addLayer({
            //     id:'countries-highlight',
            //     type:'fill',
            //     source:'country',
            //     filter:['==', 'name', "ugans"],
            //     paint:{
            //         'fill-color':'#CEB06B',
            //         'fill-opacity':1
            //     }
            // });

            break;
        case 'states':
            map.addLayer({
                id:'countries-highlight',
                type:'fill',
                source:'states',
                filter:['==', 'name', "ugans"],
                paint:{
                'fill-color':'#CEB06B',
                'fill-opacity':1
                }
            });

            break;
        default:
            return;
   }
}

function removeLayer(layerId) {
  map.removeLayer(layerId);
}