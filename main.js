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

let levelsObject = {
    continent:{name:'', bounds:null },
    country:{name:'', bounds:null },
    states:{name:'', bounds:null }
};

// 'global', 'continent', 'country', 'states'
const asideSection = document.getElementById("section-aside");
let currentLevel = 'global';
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

    map.addLayer({
        id:'countries-highlight',
        type:'fill',
        source:'country',
        filter:['==', 'name', "ugans"],
        paint:{
            'fill-color':'#CEB06B',
            'fill-outline-color':'#222',
            'fill-opacity':0.8
        }
    });


    // canada states
    map.addSource('canada', {
        type:'geojson',
        data:'/data/canada.json',
        generateId:true
    });

    // us states
    map.addSource('states', {
        type:'geojson',
        data:'/data/states.geojson',
        generateId:true
    });

    map.addLayer({
        id:'states-highlight',
        type:'fill',
        source:'states',
        filter:['==', 'name', "ugans"],
        paint:{
            'fill-color':'#CEB06B',
            'fill-outline-color':'#222',
            'fill-opacity':0.8
        }
    });

    // addLayer('countries');

    map.on('mousemove', 'continents', (e) => {
        let feature = e.features[0];
        let name = feature.properties.name;

        map.setFilter('continents-highlight', ['==', 'name', `${name}`])
        map.getCanvas().style.cursor = "pointer";

    });

    map.on('mouseleave', 'continents', (e) => {
        map.setFilter('continents-highlight', ['==', 'name', ""]);
        map.getCanvas().style.cursor = "";
    });

    map.on('mousemove', 'countries', (e) => {
        map.getCanvas().style.cursor = "pointer";
        let feature = e.features[0];

        handleMouseMove(feature);

        let name = feature.properties.name;
        map.setFilter('countries-highlight', ['==', 'name', `${name}`]);

        customRegionMarkers.toggleActiveMarker(name.toLocaleLowerCase(), "over")
    });
   

    map.on('mouseleave', 'countries', (e) => {
        map.setFilter('countries-highlight', ['==', 'name', ""]);

        map.getCanvas().style.cursor = "";
        // customRegionMarkers.toggleActiveMarker("", "leave")
    }); 

    // states
    map.on('mousemove', 'states', (e) => {
        map.getCanvas().style.cursor = "pointer";
        let feature = e.features[0];

        handleMouseMove(feature);

        let name = feature.properties.name;
        map.setFilter('states-highlight', ['==', 'name', `${name}`]);

        if(feature.properties.layer == 'canada') {
            // customRegionMarkers.toggleActiveMarker(name.toLocaleLowerCase(), "over")
        }
        
    });
   

    map.on('mouseleave', 'states', (e) => {
        // let feature = e.features[0];
        map.setFilter('states-highlight', ['==', 'name', ""]);

        map.getCanvas().style.cursor = "";

        // if(feature.properties.layer == 'canada') {
        //     customRegionMarkers.toggleActiveMarker("", "leave")
        // }
        
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

    map.on('click', 'states', (e) => {
        console.log(e.features);

        handleMouseClick(e.features[0]);
    })

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
    let padding = layer.id != 'continents' ? 150 : 50;
    map.fitBounds([[minX, minY], [maxX, maxY]], { padding });


    updateMapFooter(feature.properties.name);
    customRegionMarkers.clickPopup.remove();
    customRegionMarkers.selectedMarker.remove();

    // handle different layer
    if(layer.id != 'continents') {
        // check if country is USA/CANADA
        let countries = ['Canada', 'United States of America'];
        let name = feature.properties.name;

        if(name == 'United States of America' || name == 'Canada') {
            customRegionMarkers.removeMarkers();

            // render regions
            addLayer('states');

            // remove country layers
            if(name == 'Canada') {
                asideSection.classList.remove("d-none");
                customRegionMarkers.renderStatesCentroids(name);

                // customRegionMarkers.renderCountryMarkers(name);
            }

            levelsObject.country = { name, bounds:bbox };
            map.setPaintProperty('countries', 'fill-color', 'transparent');
            map.setFilter('countries-highlight', ['==', 'name', 'ugans']);
            removeLayer('countries');
            customRegionMarkers.removeCountryMarkers();

            currentLevel = 'country';
        } 
        else {
            // display the aside section
            asideSection.classList.remove("d-none");
            removeLayer('continent');

            if(layer.id == 'states') {
                customRegionMarkers.removeStatesCenterMarkers();
                customRegionMarkers.removeMarkers();
                customRegionMarkers.renderStatesMarkers(name);

                map.setPaintProperty('states', 'fill-color', [
                    'match',
                    ['get', 'name'],
                    `${name}`,
                    '#CEB06B',
                    'transparent'
                ]);

                currentLevel = 'states';
                levelsObject.states = { name, bounds:bbox };

            } else {

                
                currentLevel = 'country',
                customRegionMarkers.renderCountryMarkers(name);
                map.setPaintProperty('countries', 'fill-color', [
                    'match',
                    ['get', 'name'],
                    `${name}`,
                    '#CEB06B',
                    'transparent'
                ]);
                

                levelsObject.country = { name, bounds:bbox };
            }

            
            
        }
        
        addCountryPoints(name, layer.id);
        document.getElementById("next-button").classList.remove('disabled-btn');
    } else {
        levelsObject = {
            continent:{name:'', bounds:null },
            country:{name:'', bounds:null },
            states:{name:'', bounds:null }
        };

        // add countries layers
        addLayer('countries');

        // // remove continents data
        removeLayer('continents');
        map.setFilter('continents-highlight', ['==', "name", 'ugans'])
        // removeLayer('continents-highlight');

        let { name } = feature.properties;

        currentLevel = 'continent';
        levelsObject.continent =  {name, bounds:bbox};
        customRegionMarkers.removeContinentMarkers();
        customRegionMarkers.renderRegionMarkers(name);

        document.getElementById("back-button").classList.remove("disabled-btn");
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

            break;
        case 'countries':
            map.addLayer({
                id:'countries',
                type:'fill',
                source:'country',
                paint:{
                    'fill-color':'transparent',
                    'fill-outline-color':'#BCB9AC',
                    'fill-opacity': 1
                }
            });

            break;
        case 'states':
            map.addLayer({
                id:'states',
                type:'fill',
                source:'states',
                paint:{
                    'fill-color':'transparent',
                    'fill-outline-color':'#BCB9AC',
                    'fill-opacity': 1
                }
            });
        
            break;
        default:
            return;
   }
}

function removeLayer(layerId) {
    if(map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
  
}

function addCountryPoints(name, layerId) {
    switch(layerId) {
        case 'continents':
            break;
        case 'countries':
            break;
        case 'states':
            break;
        case 'regions':{

        }
    }
}

document.getElementById("globe-button").onclick = (e) => {
    console.log(e);
    e.stopPropagation();

    if(map.getLayer('continents')) {
        return;
    }

    removeLayer('states');
    removeLayer('countries');

    if(!map.getLayer('continents')) {
        addLayer('continents');
    }
    

    customRegionMarkers.renderContinentMarkers();
    customRegionMarkers.removeMarkers();
    customRegionMarkers.removeCountryMarkers();
    customRegionMarkers.clickPopup.remove();
    customRegionMarkers.selectedMarker.remove();

    asideSection.classList.add('d-none');

    map.flyTo({
        center:[2.3074205413575726, 27.31185379940868],
        zoom:1.6
    });

    // currentLevel = 'globe';
    updateMapFooter("")
}

document.getElementById("back-button").onclick = (e) => {
    console.log(e);
    console.log(currentLevel);
    let levels = Object.keys(levelsObject);

    let levelsIndex = levels.findIndex(dt => dt == currentLevel);
    
    if(levelsIndex != 0 ) {
        let index = levelsIndex - 1;
        let level = levels[index];

        let levelObj = levelsObject[level];
        console.log(levelObj);

        if(levelObj.name) {
            let { name, bounds } = levelObj;
            map.fitBounds(bounds, { padding:50 });

            updateMapFooter(name);
            currentLevel = level;
        }

        document.getElementById("next-button").classList.remove('disabled-btn');
        toggleToCurrentLayerLevel(levelObj);
    } else {
        map.flyTo({
            center:[2.3074205413575726, 27.31185379940868],
            zoom:1.6
        });
    
        updateMapFooter("");
        document.getElementById("next-button").classList.remove('disabled-btn');

        // deactive the button
        // customRegionMarkers.remo
        document.getElementById("globe-button").click();
        e.target.classList.add('disabled-btn');

        currentLevel = 'globe';
        customRegionMarkers.renderContinentMarkers();
        customRegionMarkers.removeMarkers();
        customRegionMarkers.removeCountryMarkers();

        // customRegionMarkers.removeMarkers();
        asideSection.classList.add("d-none");
    }
}

document.getElementById("next-button").onclick = (e) => {
    let levels = Object.keys(levelsObject).filter(level => {
        return levelsObject[level].name;
    });

    console.log(levels);

    let levelsIndex = levels.findIndex(dt => dt == currentLevel);
    
    if(levelsIndex != levels.length - 1 ) {
        let index = levelsIndex + 1;
        let level = levels[index];

        let levelObj = levelsObject[level];

        if(levelObj.name) {
            let { name, bounds } = levelObj;
            map.fitBounds(bounds, { padding:50 });

            updateMapFooter(name);
            currentLevel = level;
        }

        document.getElementById("back-button").classList.remove("disabled-btn");
        toggleToCurrentLayerLevel(levelObj);
    } else {
        // deactive the button
        document.getElementById("back-button").classList.remove("disabled-btn");
        e.target.classList.add('disabled-btn');
        
    }
}

function toggleToCurrentLayerLevel(levelObj) {
    customRegionMarkers.clickPopup.remove();
    customRegionMarkers.selectedMarker.remove();

    console.log(levelObj);
    if(currentLevel == 'continent') {
        customRegionMarkers.removeMarkers();
        
        customRegionMarkers.removeStatesCenterMarkers()
        resetCountryStyle();
        removeLayer('continents');
        removeLayer('states');

        // removeCountryMarkers();
        if(customRegionMarkers.regionMarkers) {
            customRegionMarkers.regionMarkers.forEach(mkr => mkr.remove());
        }

        customRegionMarkers.removeContinentMarkers();
        customRegionMarkers.renderRegionMarkers(levelObj.name);
        

        asideSection.classList.add("d-none");
        if(!map.getLayer('countries')) { addLayer('countries'); }
    } else if (currentLevel == 'country') {
        console.log("Country Layer");

        customRegionMarkers.removeMarkers();
        resetStatesTyle();
        removeLayer('continents');
        customRegionMarkers.removeContinentMarkers()

        if(levelObj.name == 'Canada' || levelObj.name == 'United States of America') {
            
            if(!map.getLayer('states')) { addLayer('states'); }

            if(levelObj.name == 'Canada') {
                asideSection.classList.remove("d-none");
                customRegionMarkers.renderStatesCentroids(levelObj.name);
            } else {
                asideSection.classList.add("d-none");
            }

            customRegionMarkers.renderStatesCentroids(levelObj.name);
            customRegionMarkers.removeCountryMarkers();
            removeLayer('countries');
           
            return;
        }

        // customRegionMarkers.removeStatesCenterMarkers();
        customRegionMarkers.renderCountryMarkers(levelObj.name);
        removeLayer('states');
        selectCountry(levelObj.name);     
        asideSection.classList.remove("d-none");  
    } else if (currentLevel == 'states') {
        console.log("Layer States");

        if(!map.getLayer('states')) { addLayer('states'); }
        selectState(levelObj.name);

        customRegionMarkers.removeStatesCenterMarkers();
        customRegionMarkers.renderStatesMarkers(levelObj.name);
        asideSection.classList.remove("d-none");
    } else {

    }
}

function resetCountryStyle() {
    if(map.getLayer('countries')) {
        map.setPaintProperty('countries', 'fill-color', 'transparent');
    }   
}

function selectCountry(name) {
    if(!map.getLayer('countries')) { addLayer('countries'); }

    if(name == 'United States of America' || name == 'Canada') {
        console.log("Add States Layer");

        if(!map.getLayer('states')) { addLayer('states'); } 
    } else {
        map.setPaintProperty('countries', 'fill-color', [
            'match',
            ['get', 'name'],
            `${name}`,
            '#CEB06B',
            'transparent'
        ]);
    }
    
}

function selectState(name) {
    if(!map.getLayer('states')) { addLayer('states'); }   

    map.setPaintProperty('states', 'fill-color', [
        'match',
        ['get', 'name'],
        `${name}`,
        '#CEB06B',
        'transparent'
    ]);
}

function resetStatesTyle() {

    if(map.getLayer('states')) {
        map.setPaintProperty('states', 'fill-color', 'transparent');
    }
    
}


// Custom region markers
class CustomRegionMarker {
    constructor(mapCenters, statesCenters, continentCenters) {
        this.countryCenters = mapCenters;
        this.statesCenters = statesCenters;
        this.continentCenters = continentCenters;
        this.activeDestinations = [];
        this.destinationMarkers = [];

        this.clickPopup = new mapboxgl.Popup({ 
            focusAfterOpen:false, 
            closeOnMove:false, 
            closeOnClick:false, 
            offset:15,
            anchor:'bottom'
        });
    }

    getPlacesData() {

        Papa.parse('/data/destinations.csv', {
            download: true,
            header:true,
            complete: results => {
                console.log(results);
                this.processData(results.data);
            }
        });

        let divMarker = document.createElement("div");
        divMarker.className = "div-marker marker-select";
        divMarker.innerHTML = ``;

        let markerDiv = document.createElement("div");
        markerDiv.innerHTML = `<img class="diamond-icon" src='diamond-selected.png' />`;
        divMarker.append(markerDiv);

        this.selectedMarker = new mapboxgl.Marker({ element: divMarker });

    }
    
    processData(results) {
        let resultsClean = results.map(item => {
            item.coordinates = item.Coordinates ? this.extractCoords(item.Coordinates) : "";

            return item;
        });

        this.destinations = resultsClean;
    }

    extractCoords(coordString) {
        let [lat, lng] = coordString.split(",");

        if(lat.includes('S')) {
            lat = -parseFloat(lat);
        } else {
            lat = parseFloat(lat);
        }

        if(lng.includes("W")) {
            lng = -parseFloat(lng);
        } else {
            lng = parseFloat(lng);
        }

        return [lng, lat];
    }

    renderStatesCentroids(name) {
        console.log(name);
        this.states = this.statesCenters.features.filter(state => state.properties.country == name);

        // CentroidsMarkers
        // combine both states and destinations

        let statesDestinations = this.destinations.filter(dest => dest.Country == name && !dest.City);

        statesDestinations = statesDestinations.map(dest => {
            let state = this.states.find(state => state.properties.name == dest.State);

            if(!state) {
                return {...dest};
            }

            // console.log(state);
            return { ...dest, coordinates:state.geometry.coordinates };
        });

        console.log(statesDestinations);
        this.regionMarkers.forEach(mkr => mkr.remove());

        if(this.stateMarkers) {
            this.stateMarkers.forEach(mkr => mkr.addTo(map));

            return;
        }

        this.stateMarkers = statesDestinations.filter(point => point.coordinates).map(entry => {
            entry = { name:entry.City, center:entry.coordinates, ...entry };

            return this.createMarker(entry, false);
        });

        // render the cards section
        this.toggleDestinations();
        this.updateCardSection(statesDestinations);

        // this.renderMarkers(statesDestinations, true);
    }

    renderStatesMarkers(name) {
        this.clickPopup.remove();
        this.statesDestinations = this.destinations.filter(dt => dt.State == name);

        if(this.statesDestinations.length == 0) {
            asideSection.classList.add('d-none');
        }

        console.log(name);

        console.log(this.statesDestinations);
        this.renderMarkers(this.statesDestinations, true);

        if(this.regionMarkers) {
            this.regionMarkers.forEach(marker => {
                marker.remove();
            });
        }

        this.isCountryMarkers = false;
    }

    renderCountryMarkers(country) {
        this.removeMarkers();
        this.removeContinentMarkers();

        this.countryDestinations = this.destinations.filter(dt => dt.Country == country);

        this.selectedMarker.remove();
        this.clickPopup.remove();
        // console.log(this.activeDestinations);

        if(this.countryDestinations.length > 1) {
            console.log("Removing Region Markers");
            this.regionMarkers.forEach(marker => marker.remove());
        } else {
            this.regionMarkers.forEach(marker => marker.addTo(map));
        }

        this.renderMarkers(this.countryDestinations, true);
        this.isCountryMarkers = true;
    }  

    renderContinentMarkers() {
        let continents = this.continentCenters.features.map(ft => {
            return { center:ft.geometry.coordinates, ...ft.properties };
        });

        console.log(continents);

        if(this.continentMarkers) {
            this.continentMarkers.forEach(mkr => mkr.addTo(map));
        } else {
            this.continentMarkers = continents.map(continent => this.createMarker(continent, false));
        }
        

        // this.renderMarkers(continents, false);
    }
    
    
    renderMarkers(destinations, isStates) {
        // render the markers
        this.destinationMarkers = destinations.filter(dt => dt.coordinates).map(entry => {
            entry = { name:entry.City, center:entry.coordinates, ...entry };

            let popup = new mapboxgl.Popup({focusAfterOpen:false, anchor:'bottom', offset:15});
            popup.setHTML(`<div class="popupt-title">${entry.City || entry.State}</div>`);

            let marker = this.createMarker(entry, isStates);
            marker.setPopup(popup);

            return marker;  
        });

        // render the cards section
        this.toggleDestinations();
        this.updateCardSection(destinations);
    }
    
    createMarker(point, isStates) {
        let divMarker = document.createElement("div");
        divMarker.classList.add("div-marker");
        divMarker.id = point.name.toLocaleLowerCase();

        let markerDiv = document.createElement("div");
        markerDiv.className = "priority map-marker-label";

        if(!isStates) {
            let name = point.name == 'United State of America' ? 'USA' : point.name == 'United Arab Emirates' ? 'UAE' : point.name;
            markerDiv.setAttribute("data-tooltip-text", name);
        }        

        markerDiv.innerHTML = `<img class="diamond-icon" src='diamond.png' alt="${point.name}" />`;

        divMarker.append(markerDiv);
        let marker = new mapboxgl.Marker({element:divMarker}).setLngLat(point.center).addTo(map);

        if(isStates) {

            divMarker.onmouseover = (e) => {
                let img = e.target.querySelector("img");
                
                if(img) {
                    // console.log(img);
                    img.src = "diamond-selected.png"
                }
                
                marker.togglePopup()
            };

            divMarker.onmouseleave = (e) => {
                let img = e.target.querySelector("img");
                
                if(img) {
                    // console.log(img);
                    img.src = "diamond.png"
                }

                marker.togglePopup();
            };

            divMarker.onclick = (e) => {
                console.log(marker);
                e.stopPropagation();
                this.selectedMarker.remove();

                let content = `<div>${point.name}</div>`;

                if(point.City || point.State) {
                    this.clickPopup
                        .setHTML(content)
                        .setLngLat(marker.getLngLat())
                        .addTo(map);

                        this.selectedMarker.setLngLat(marker.getLngLat()).addTo(map);

                    // update the regions
                    this.updateActiveDestination(point.City || point.State);
                }
                
            }
        }

        
        return marker;
    }

    renderRegionMarkers(continent) {
        console.log("adding Markers");

        let countries = this.countryCenters.features.filter(ft => ft.properties.Region == continent);

        this.regionMarkers = countries.map(cntry => {
            let obj = {center:cntry.geometry.coordinates, ...cntry.properties};
            let marker = this.createMarker(obj, false);

            marker.getElement().onclick = (e) => {
                console.log("Regions Markers");

                // query countries
                let feature;
                if(cntry.properties.name == 'Maldives') {
                    feature = Maldives;
                    feature.layer = {id:'countries'}
                } else {
                    let features = map.queryRenderedFeatures({layers:['countries']});
                    console.log(cntry);
    
                    feature = features.find(ft => ft.properties.name == cntry.properties.name);
                }

                console.log(feature);
                handleMouseClick(feature);
            };

            marker.id = cntry.properties.name;

            return marker;
        });  
    }

    removeMarkers() {
        if(this.destinationMarkers) { 
            this.destinationMarkers.forEach(marker => marker.remove());
        }
    }

    removeStatesCenterMarkers() {

        if(this.stateMarkers) {
            this.stateMarkers.forEach(mkr => mkr.remove());
        }
    }

    removeCountryMarkers() {
        this.regionMarkers.forEach(mkr => mkr.remove());
    }

    removeContinentMarkers() {
        this.continentMarkers.forEach(mkr => mkr.remove());
    }

    updateCardSection(destinations) {
        if(!destinations) {
            return;
        }

        // update count
        this.activeDestinations = destinations;
        this.updateCardContent(destinations[0]);
        this.updateCardCount(destinations, 1);

        // hide footer is we only have a single destination
        if(destinations.length == 1) {
            document.querySelector(".card-footer nav").classList.add('d-none');
        } else {
            document.querySelector(".card-footer nav").classList.remove('d-none');
        }
    }

    toggleDestinations() {
        let i = 0;
        document.getElementById("next-dest").onclick = (e) => {
            if(i < this.activeDestinations.length - 1) {
                i++
            } else {
                i = 0;
            }

            let destination = this.activeDestinations[i];
            this.updateCardContent(destination);
            this.updateClickPopup(destination);
            this.updateCardCount(this.activeDestinations, i+1);
        }

        document.getElementById("prev-dest").onclick = (e) => {
            if(i == 0) {
                i = this.activeDestinations.length - 1;
            } else {
                i -= 1;
            }

            let destination = this.activeDestinations[i];
            this.updateCardContent(destination);
            this.updateClickPopup(destination);
            this.updateCardCount(this.activeDestinations, i+1);
        }
    }

    updateActiveDestination(name) {
        let destination = this.activeDestinations.find(dest => dest.City == name);
        let destinationIndex = this.activeDestinations.findIndex(dest => dest.City == name);

        this.updateCardContent(destination);
        this.updateClickPopup(destination);
        this.updateCardCount(this.activeDestinations, destinationIndex);
    }


    updateCardCount(destinations, index) {
        document.querySelector(".destination-index").innerHTML = `${index} of ${destinations.length}`;
    }

    updateCardContent(destination) {
        if(!destination) { return };

        console.log(destination);
    

        let imageUrl = destination['image'] || 'bg_image.jpg';
        let titleText = destination.State ? (destination.City || destination.State) : (destination.City || destination.Country);
        let placeType =  destination.State ? 'State' : destination.City ? 'City' : 'Country';

        document.getElementById("card-header").innerHTML = `
            <div class="card-top">
                <img src="${imageUrl}" alt="" height="100%" width="100%">
            </div>

            <section>
                <h5>${placeType}</h5>
                <h1>${titleText}</h1>
                <span class="sub-header">${destination['Place type']} | ${destination['Havens count']}</span>
            </section>
        `;

        document.getElementById("place-link").href = `https://www.google.com/maps/place/${titleText}`;
        document.getElementById("article").innerHTML = destination.Descriptions;
    }

    toggleActiveMarker(id, action) {
        
        if(this.activeMarker) {
            return;
        }

        if(this.isCountryMarkers) {
            return;
        }

        let divMarker = document.getElementById(id);
        console.log("Active Maker:", divMarker)

        if(action == 'over' && divMarker) {
            console.log("Active Maker")
            let img = divMarker.querySelector("img");
            
            if(img && divMarker) {
                img.src = "diamond-active.png"
            }

            this.activeMarker = divMarker;

        } else {
            if(!this.activeMarker) return;
            let img = this.activeMarker.querySelector("img");
            
            if(img) {
                img.src = "diamond.png"
            }
        }

    }

    toggleMarkers(level, name) {
        // levels object
        if(level == 'continent') {
            // toggle the respective markers

        } else if (level == 'country') {
            // select the country: if country is not USA or Canada
        } else if (level == 'states') {
            // select the state
        } else {
            // other logic
        }

    }


    // render different sets of popups
    renderHoverPopup() {
        this.clickPopup.remove();
    }

    updateClickPopup(destination) {

        // this.destinationMarkers.forEach(mkr => {
        //     this.toggleMarkerIcon(mkr.getElement().id, "");
        // });
        
        if(destination.coordinates) {
            let content = `<div>${destination.City || destination.State}</div>`;

            // this.toggleMarkerIcon(destination.City.toLocaleLowerCase(), 'active');
            this.selectedMarker
                .setLngLat(destination.coordinates)
                .addTo(map);

            this.clickPopup
            .setHTML(content)
                .setLngLat(destination.coordinates)
                .addTo(map);
        } else {
            this.clickPopup.remove();
            this.selectedMarker.remove();
        }
    }

    toggleMarkerIcon(markerId, action="") {
        let divMarker = document.getElementById(markerId);

        if(!divMarker){ return; }
        if(action == 'active') {
            let img = divMarker.querySelector("img");
            img.src = "diamond-selected.png";

            // this.activeMarker = divMarker;

        } else {
            console.log("reset icon");
            let img = divMarker.querySelector("img");
            img.src = "diamond.png";
        }
    }
}




const customRegionMarkers = new CustomRegionMarker(countryCenters, statesCenters, continentCenters);
customRegionMarkers.getPlacesData();
customRegionMarkers.renderContinentMarkers();



// TODO:
// - remove before on states markers;
// - on click marker set active

// - if the country does not have specific destinations: keep the markers: DONE