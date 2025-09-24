/* globals turf, shpwrite */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

import { 
  coastalProcessCal, 
  // coastalConditionCal, 
  // combinedModelCal 
} from './model.js';

const modelName = {
  'cp': 'Length of Coastal Process',
  'cc': 'Area of Coastal Condition',
  'cm': 'Area of Combined Model'
};

// color scale for the resolution
// more info at: https://d3js.org/d3-interpolate/color#interpolateRgb
const colorScale = d3.interpolateRgbBasis(['rgb(140, 152, 255)', 'rgb(154, 220, 255)', 'rgb(186, 249, 183)', 'rgb(255, 211, 153)', 'rgb(255, 155, 144)']);
window.colorScale = colorScale;

// color scale for the unit
const unitColorScale = d3.interpolateRgbBasis(['rgb(140, 152, 255)', 'rgb(154, 220, 255)', 'rgb(186, 249, 183)', 'rgb(255, 211, 153)', 'rgb(255, 155, 144)']);
window.unitColorScale = unitColorScale;

// marker icon
const scissorIcon = L.icon({
  iconUrl: 'img/ScissorsMarker.png',
  iconSize: [30, 45], // size of the icon
  iconAnchor: [15, 45], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -35], // point from which the popup should open relative to the iconAnchor
});

// shapefile download setting
const shpOptions = {
  folder: 'download_unit_shp',
  filename: 'unit_result',
  outputType: 'blob',
  compression: 'DEFLATE',
  types: {
    // point: 'mypoints',
    // polygon: 'mypolygons',
    polyline: 'Coastline By Unit',
  },
};


// step 1 supporting functions

// add start and end marker to the end of the shoreline
function initializePoints(map, point, icon) {
  const pointMarker = L.marker([point[1], point[0]], {
    draggable: true,
    icon: icon,
  }).addTo(map.markerLayer);
  return pointMarker;
}

// function reinitializePoints(marker, point) {
//   marker.setLatLng([point.geometry.coordinates[1], point.geometry.coordinates[0]]);
// }

// snap the maker to the nearest point on the coastal line after user drag markers
function handleMarkerSnap(coastLine, marker, map) {
  const newPoint = marker.getLatLng(); // get the coordinates of the final marker

  const newPointTurf = turf.point([newPoint.lng, newPoint.lat]); // turf coordinates are the opposite of leaflet
  const snappedPoint = turf.nearestPointOnLine(coastLine, newPointTurf);

  // reset marker location after dragged, snap to nearest point
  marker.setLatLng([snappedPoint.geometry.coordinates[1], snappedPoint.geometry.coordinates[0]]); // reset the location of the marker
}


// step for resolution functions

// step for resolution botton manipulation part



// step for resolution calculation part


// step for resolution supporting functions


// get min max from feature array
function getMinMaxFromFeatureArray(featureArray, prop) {
  // The final value now may be skewed, need to normalize it to make sure it will be between 0 and 1
  const finalValueArray = featureArray.map((f) => f.properties[prop]); // map will return an array of all the properties.finalValue

  // calculate the min max of the values
  const min = Math.min(...finalValueArray); // ...flatten the array because min/max doesn't take array
  const max = Math.max(...finalValueArray);

  return [min, max];
}

// divide the slice into certain length

function getFtResolution(line, num) { // num is ft
  // use 3000ft res for all inputs
  const resolutionCal = num * 0.0003048; // ft to km
  const resolutionCollection = turf.lineChunk(line, resolutionCal); // unit here is km
  return resolutionCollection;
}


// step for category grouping functions

// step for category grouping botton manipulation part

// prepare and call category grouping functions


// step for category grouping calculation part


// step for category grouping supporting functions


// assign category number to final score's value



// last step functions

// handle download
// need to be an async function because in the shapefile download part shpwrite.zip generate a promise, and need await for that promise to be down (similar to fetch, also a promise)
async function handleDownload(units, fileTypeSelect, shpOptions, name) {
  // figure out downloading data type based on dropdown box value
  const fileType = fileTypeSelect.value;
  let blob; // for the browser download
  let fileName; // have it here to be reassigned later for the filename based on selection
  if (fileType == 'geojson') {
    const stringUnit = JSON.stringify(units); // stringfy geojson feature collection
    blob = new Blob([stringUnit], {type: 'application/json'});
    fileName = `${name}.json`;
  } if (fileType == 'shapefile') {
    // a GeoJSON bridge for features
    // in the options can have blob as output type
    blob = await shpwrite.zip(
      units, // need geojson here
      shpOptions,
    );
    console.log(blob);
    fileName = `${name}.zip`;
  }
  // how to download from blob object
  const url = window.URL.createObjectURL(blob);
  console.log(url);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  // the filename you want
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}


// Other functions related to model calculations


function getSimplerLineFromLine(lineString) { // returns point's coordinate arrays
  const linePoints = lineString.geometry.coordinates;
  const pointNum = linePoints.length;
  const start = linePoints[0];
  const end = linePoints[pointNum - 1];
  // prepare for the middle points addition
  const pointArray = [];
  pointArray.push(start);

  if (pointNum < 6) {
    return [start, end];
  } else if (pointNum < 40) { // add middle point for line with more than 6 points but less than 20 points
    const chunkLength = Math.floor(pointNum / 2); // calculate the interval of selection and get the integer part
    const mid = linePoints[chunkLength];
    pointArray.push(mid);
    pointArray.push(end);
    return pointArray;
  } else { // more than 20 points, add 4 middle points
    const chunkLength = Math.floor(pointNum / 4); // calculate the interval of selection and get the integer part
    for (let i = chunkLength; i < pointNum - 1; i = i + chunkLength) {
      const midPoint = linePoints[i];
      // Sometimes the last midPoint will be the same as the end point, and turf cannot process that
      if (midPoint[0] !== end[0] || midPoint[1] !== end[1]) {
        pointArray.push(midPoint);
      }
    }
    pointArray.push(end);
    return pointArray;
  }
}

// get box within certain distance to prepare for overlap analysis when assigning values
function getResolutionBoxes(Collection, num) {
  const allBoxes = [];
  for ( const i of Collection.features) {
    // if want to see the length of each chunk
    // const length = turf.length(i);
    // console.log(length);

    // simplify the coastaline
    const simplerArray = getSimplerLineFromLine(i);
    const simpleI = turf.lineString(simplerArray);
    // L.geoJson(simpleI, {color: 'black'}).addTo(map);

    // offset simplified coastline and get end points for each
    const offsetLine1 = turf.lineOffset(simpleI, num); // unit in km
    const offsetLine2 = turf.lineOffset(simpleI, -num); // unit in km
    const [Line1Start, Line1End] = getStartEndPointsFromLine(offsetLine1);
    const [Line2Start, Line2End] = getStartEndPointsFromLine(offsetLine2);

    // draw the additional boundary lines
    // const connectLine1 = turf.lineString([Line1Start, Line1End]);
    const connectLine2 = turf.lineString([Line1End, Line2End]);
    // const connectLine3 = turf.lineString([Line2End, Line2Start]);
    const connectLine4 = turf.lineString([Line2Start, Line1Start]);

    const resolutionBoxLines = turf.featureCollection([offsetLine1, connectLine2, offsetLine2, connectLine4]);

    const resolutionBox = turf.polygonize(resolutionBoxLines);

    // add all the properties from line to box
    resolutionBox.features[0].properties = i.properties;

    allBoxes.push(resolutionBox.features[0]); // .features[0] can avoid the situation of feature collection within feature collection
  }
  const allBoxesCollection = turf.featureCollection(allBoxes);
  return allBoxesCollection;
}


// collection of return manipulations

function returnToGenerateGroup() {
  categoryBox.disabled = false;
  generateGroupButton.disabled = false;
  fileTypeSelect.disabled = true;
  downloadButton.disabled = true;
}

function returnToGenerateRes(map) {
  // disable group unit buttons
  categoryBox.value = '';
  categoryBox.disabled = true;
  generateGroupButton.disabled = true;
  finishGroupButton.disabled = true;
  // enable res buttons
  for (const i of dropdownAll) {
    i.disabled = false;
  }
  generateResButton.disabled = false;
  finishResButton.disabled = false;
  // map cleanup
  if (map.finalUnitLayer !== null) {
    map.finalUnitLayer.clearLayers();
  }
  // remove unit legend
  const legendContent = document.querySelector('.legend-content');
  if (legendContent.querySelector('.unit-legend') !== null) {
    const oldLegend = legendContent.querySelector('.unit-legend');
    legendContent.removeChild(oldLegend);
  }
}

function returnToStart(map) {
  // enable the start buttons
  startButton.disabled = false;
  finishButton.disabled = false;
  // clear the map
  map.flyToBounds(map.zoomRefLayer.getBounds());
  map.sliceLayer.clearLayers();
  if (map.colorLayer !== null) {
    map.colorLayer.clearLayers();
  }
  map.legend.remove();

  firstDrop.value = '';
  // clear dynamic dropdown
  clearDynamicDropdown('#second-priority');
  clearDynamicDropdown('#third-priority');
  for (const i of dropdownAll) {
    i.disabled = true;
  }
  generateResButton.disabled = true;
  finishResButton.disabled = true;
}

function clearDynamicDropdown(ID) {
  const DropBox = document.querySelector(ID);
  if (DropBox.querySelectorAll('option') !== null) {
    DropBox.innerHTML = '';
  }
}



export {
  modelName,
  colorScale,
  unitColorScale,
  shpOptions,
  initializePoints,
  handleMarkerSnap,
  getFtResolution,
  getResolutionBoxes,
  getMinMaxFromFeatureArray,
  handleDownload,
  clearDynamicDropdown,
};


