/* globals turf */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

import { legend1Style, legend3Style } from './map.js';
import {coastalProcessCal, coastalProcessSim, coastalConditionCal, coastalConditionSim, combinedModelCal, combinedModelSim, combineModelPropToArray, coastalConditionPropToArray } from './model.js';
import { withSpinnerDo, displaySelectPointScoreOnRange, getParsed, fillSlider } from './logistics.js';
import { modelName, colorScale, unitColorScale, getMinMaxFromFeatureArray, handleDownload } from './cal.js';
import { initializePoints, handleMarkerSnap } from './cal.js';

// similar finder inputs
// get step 1 buttons
const startButtonSim = document.querySelector('.select-point-sim');
const finishButtonSim = document.querySelector('.finish-point-sim');
const returnStartButtonSim = document.querySelector('.return-select-point-sim');
// get step 2 input boxes
const firstDropSim = document.querySelector('#first-priority-sim');
const dropdownAllSim = document.getElementsByClassName('priority-sim'); // all dropdown boxes
const showModelButton = document.querySelector('.show-model-sim');
const finishShowModel = document.querySelector('.finish-show-model-sim');
const returnShowModelButton = document.querySelector('.return-show-model-sim');
// get step 3 buttons
const fromSliderSim = document.querySelector('#fromSlider');
const toSliderSim = document.querySelector('#toSlider');
const fromInputSim = document.querySelector('#fromInput');
const toInputSim = document.querySelector('#toInput');
const percentageDisplay = document.querySelector('#percentageDisplay');
const generateGroupButtonSim = document.querySelector('.generate-group-sim');
const finishGroupButtonSim = document.querySelector('.finish-group-sim');
const returnGenerateGroupButtonSim = document.querySelector('.return-generate-group-sim');
// get step 4 stuff
const downloadButtonSim = document.querySelector('.download-unit-sim');
const fileTypeSelectSim = document.querySelector('.file-type-sim');


// get reverse color scale
const reversedUnitColorScale = (t) => unitColorScale(1 - t);

// range color style
const rangeColorStyle = {
  stroke: true,
  color: 'rgba(223, 46, 2, 1)',
  weight: 20,
  opacity: 0.8,
  lineCap: 'butt',
};

// shapefile download setting
const shpOptionsSim = {
  folder: 'download_similarity_shp',
  filename: 'similarity_result',
  outputType: 'blob',
  compression: 'DEFLATE',
  types: {
    // point: 'mypoints',
    // polygon: 'mypolygons',
    polyline: 'Coastline By Similarity',
  },
};

// marker icon
const flagIcon = L.icon({
  iconUrl: 'img/FlagMarker.png',
  iconSize: [30, 45], // size of the icon
  iconAnchor: [15, 45], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -35], // point from which the popup should open relative to the iconAnchor
});

// map.js will cal this function for similarity finder
function handleSimilarityCalculations(mid, map, shorelineBase) {
  const coastLine = turf.lineString(shorelineBase.features[0].geometry.coordinates);

  startButtonSim.addEventListener('click', () => {
    handleSimilarityMapSelection(map, mid, coastLine);
  });
}


// function for similarity finder
function handleSimilarityMapSelection(map, mid, coastLine) {
  // clear any existing features / reset
  map.flyToBounds(map.zoomRefLayer.getBounds());
  map.markerLayer.clearLayers();
  map.pickPointLayer.clearLayers();

  // draggable markers part
  const midMarker = initializePoints(map, mid, flagIcon);

  midMarker.addEventListener('dragend', () => {
    handleMarkerSnap(coastLine, midMarker, map);
  });

  // next button part after user selected a point
  // this button is set within the start button to make sure nothing will happen if people do not "start"
  finishButtonSim.addEventListener('click', () => {
    withSpinnerDo(() => {
      const [midMarker] = map.markerLayer.getLayers();
      // for some reasons there will be more than one marker if rerun this step, only the final one will be valid
      if (midMarker !== void 0) { // void 0 is the same as undefined
        calResForSimilarity(midMarker.getLatLng(), coastLine, map);
      }
    });
  });
}

// handle marker point after user moved them
function calResForSimilarity(newMid, coastLine, map) {
  // zoom to the whole coastline
  map.fitBounds(map.zoomRefLayer.getBounds());
  // disable step 1 buttons
  startButtonSim.disabled = true;
  finishButtonSim.disabled = true;

  // map selected point on map
  map.markerLayer.clearLayers();
  const midPointSelect = turf.point([newMid.lng, newMid.lat]);
  map.pickPointLayer.addData(midPointSelect);

  // enable step 2 buttons
  showModelButton.disabled = false;
  finishShowModel.disabled = false;

  // handle setp 2 dropdown options
  firstDropSim.disabled = false;

  // handle return button
  returnStartButtonSim.addEventListener('click', () => {
    returnToSliderGroup();
    returnToGenerateResSim(map);
    returnToStartSim(map, coastLine);
  });

  // handle inputs from form
  showModelButton.addEventListener('click', () => {
    withSpinnerDo(() => {
      handleSimCalculations(midPointSelect, firstDropSim, map, coastLine);
    });
  });
}

// actual res calculations
function handleSimCalculations(midPointSelect, firstDropSim, map, coastalLine) {

  // selected model options
  const modelSelect = {
  'cp': window.coastalProcessing,
  'cc': window.coastalCondition,
  'cm': window.conditionProcessingCombine,
  };

  // list all the dropdown's avaliable models and associated properties
  const modelFuncs = {
    'cp': coastalProcessCal,
    'cc': coastalConditionCal,
    'cm': combinedModelCal
  };

  // name in properties for each model
  const modelNamesInProperties = {
    'cp': 'cpLength',
    'cc': 'ccArea',
    'cm': 'cmArea'
  };

  const modelSimFuncs = {
    'cp': coastalProcessSim,
    'cc': coastalConditionSim,
    'cm': combinedModelSim
  }

  // zoom to the whole coastline
  map.fitBounds(map.zoomRefLayer.getBounds());

  if (map.colorLayer !== null) {
    map.colorLayer.clearLayers();
  }

  // get which model is selected
  if (firstDropSim.value === '') {
    alert('Please select at least one priority to proceed.');
    return;
  }
  const resolutionCollection = modelSelect[firstDropSim.value]; // feature collection of the selected model

  const calMethod = modelFuncs[firstDropSim.value]; // calculation function of the selected model
  const propertiesName = modelNamesInProperties[firstDropSim.value]; // new property name of the selected model
  const simCalModel = modelSimFuncs[firstDropSim.value]; // similarity function of the selected model
  const propertiesNameNormal = propertiesName + 'Normal';
  calMethod(resolutionCollection, propertiesName);

  // need to normalize the values in order for color scale to work in 0 to 1 range
  const propertiesValueArray = resolutionCollection.features.map((f) => f.properties[propertiesName]); // map will return an array of all the properties[propertiesName]

  // calculate the min max of the values
  const min = Math.min(...propertiesValueArray); // ...flatten the array because min/max doesn't take array
  const max = Math.max(...propertiesValueArray);

  // use a D3 scale to normalize this data
  // see avaliable scale here: https://d3js.org/d3-scale
  // scale descriptions: https://observablehq.com/@d3/continuous-scales
  // here use power scale
  // scale factor is the thing to control the shape of the reprojection
  const scaleFunc = d3.scalePow([min, max], [0, 1]).exponent(1);
  // add the normalized value to each coastline properties
  for (const coastline of resolutionCollection.features) {
    const normalResult = scaleFunc(coastline.properties[propertiesName]);
    coastline.properties[propertiesNameNormal] = normalResult;
  }

  console.log(resolutionCollection);

  // add the selected data to map and color that based on the normalized score of each coastline piece
  map.colorLayer = L.geoJSON(resolutionCollection, {
    style: (sample) => {
      const colorValue = colorScale(sample.properties[propertiesNameNormal]);
      return {
        stroke: true,
        color: colorValue,
        weight: 3,
      };
    },
  }).addTo(map);

  // add legend for the resolution box
  map.legend.onAdd = (map) => {
    return legend1Style(map, colorScale, 'legend-content-sim');
  };
  map.legend.addTo(map);

  // find final score for the selected point
  // findClosestData only takes polygon/line, not point, so need to buffer the point
  const bufferedPoint = turf.buffer(midPointSelect, 0.05);
  var pointScore = null;
  pointScore = findClosestData(resolutionCollection, bufferedPoint);

  map.pickPointLayer.bringToFront()
    .bindTooltip((l) => {
      return `
        <p class="unit-tooltip"><strong>Final score: </strong>${pointScore[0].properties[propertiesName].toFixed(2)}</p>
      `;
    }).bindPopup((l) => {
      return `
        <p class="unit-tooltip">Your selected point has a final score of <strong>${pointScore[0].properties[propertiesName].toFixed(2)}</strong></p>
      `;
    });

  // process to the following step if user click next
  finishShowModel.addEventListener('click', () => {
    simGroupRes(map, resolutionCollection, firstDropSim, pointScore, propertiesNameNormal, simCalModel, modelNamesInProperties);
  });
}

// prepare for filtering
function simGroupRes(map, resolutionCollection, firstDropSim, pointScore, propertiesNameNormal, simCalModel, modelNamesInProperties) {
  // enable step 3 box
  fromSliderSim.disabled = false;
  // toSliderSim.disabled = false;
  fromInputSim.disabled = false;
  // toInputSim.disabled = false;
  generateGroupButtonSim.disabled = false;
  finishGroupButtonSim.disabled = false;

  // disable step 2 buttons
  finishShowModel.disabled = true;
  showModelButton.disabled = true;
  firstDropSim.disabled = true;

  // add selected point's score to range bar
  displaySelectPointScoreOnRange(pointScore[0].properties[propertiesNameNormal.replace(/Normal$/, '')].toFixed(2));

  // handle return to priority step
  returnShowModelButton.addEventListener('click', () => {
    returnToSliderGroup();
    returnToGenerateResSim(map);
  });

  // handle range input
  generateGroupButtonSim.addEventListener('click', () => {
    handleGroupResSim(map, resolutionCollection, firstDropSim, pointScore, propertiesNameNormal, simCalModel, modelNamesInProperties);
  });
}

// filter by range
function handleGroupResSim(map, resolutionCollection, firstDropSim, pointScore, propertiesNameNormal, simCalModel, modelNamesInProperties) {
  // zoom to the whole coastline
  map.fitBounds(map.zoomRefLayer.getBounds());
  // clear any existing features / reset
  if (map.finalSimLayer !== null) {
    map.finalSimLayer.clearLayers();
  }

  // get range input values
  var [from, to] = getParsed(fromSliderSim, toSliderSim);
  from = from / 100;
  to = to / 100;

  // calculate similarity based on selected model
  const [simGeojson, minSim, maxSim] = selectSimToGeojson(resolutionCollection, from, to, pointScore, simCalModel);

  // add unit legend
  legend3Style(map, reversedUnitColorScale, minSim, maxSim);

  // add the res in the selected range to map and color that based on the normal final score of each coastline piece
  // adjust pop up based on number of selected priorities
  const firstPropName = modelName[firstDropSim.value];
  const propNeed = modelNamesInProperties[firstDropSim.value];
  map.finalSimLayer = L.geoJSON(simGeojson, rangeColorStyle).bindTooltip((l) => { // final unit box tooltip options
    return `<p class="unit-tooltip"><strong>Similarity:</strong> ${(l.feature.properties.similarity * 100).toFixed(1) } %</p>`;
  }).bindPopup((l) => { 
    // Generate unique ID for the canvas to avoid conflicts
    const canvasId = `radar-canvas-${l.feature.properties.ID}`;
    
    return `<h3 class="unit-pop-title">ID: ${l.feature.properties.ID + 1}</h3>
            <p class="unit-first-priority">Similarity percentage of <em>${firstPropName}</em> to chosen point is <strong>${(l.feature.properties.similarity * 100).toFixed(1)}</strong> %</p>
            <p class="unit-finalscore">Absolute Value: ${(l.feature.properties[propNeed]).toFixed(4)}</p>
            <canvas class="canvas" id="${canvasId}"></canvas>
            <ul class="popup-legend">
              <li class="diagram-legend">
                <span class="circle-color" style="background-color: #0077ff; width: 6px; height: 6px; border-radius: 3px; margin-left: 8px; margin-right: 8px"></span>
                <span class="lead-label">This area's diagram</span>
              </li>
              <li class="diagram-legend">
                <span class="circle-color" style="background-color: #ff6600; width: 6px; height: 6px; border-radius: 3px; margin-left: 7px; margin-right: 7px"></span>
                <span class="lead-label">Selected point's diagram</span>
              </li>
              </ul>
    `;
  }).addTo(map);

map.finalSimLayer.on("popupopen", (e) => {
  const canvas = e.popup._contentNode.querySelector(".canvas");
  if (!canvas) return;

  const modelPropsAxisName = {
  'cp': ["Sediment Loss", "Retreat Rate"],
  'cc': ["Slope", "Landcover", "Shore Type"],
  'cm': ["Slope", "Landcover", "Shore Type", "Sediment Loss", "Retreat Rate"]
  };

  const modelPropSelect = {
    // 'cp': combineModelPropToArray,
    'cc': coastalConditionPropToArray,
    'cm': combineModelPropToArray
  }

  const currentModel = firstDropSim.value;

  if (currentModel == 'cp') {
    canvas.style.display = 'none';
  } else {
    canvas.style.display = 'inline';
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);

    // extract feature data
    const f = e.layer.feature.properties;
    modelPropSelect[currentModel](f);
    const combineArray = modelPropSelect[currentModel](f);

    // define corresponding axis names
    const axisNames = modelPropsAxisName[currentModel];

    // draw a test radar shape
    const MAX_SCALE = 4;
    const n = combineArray.length;

    // helper: convert to XY
    const coords = [];
    for (let i = 0; i < n; i++) {
      const theta = (2 * Math.PI * i) / n - Math.PI / 2;
      coords.push([
        combineArray[i] * Math.cos(theta),
        combineArray[i] * Math.sin(theta)
      ]);
    }
    coords.push(coords[0]); // close shape

    //  scale to fit canvas
    const scale = (size / 2 - 40) / MAX_SCALE;
    ctx.scale(scale, -scale);

    //  draw axes
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 0.02;
    for (let i = 0; i < n; i++) {
      const theta = (2 * Math.PI * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(MAX_SCALE * Math.cos(theta), MAX_SCALE * Math.sin(theta));
      ctx.stroke();

      // draw axis label
      const nameX = (MAX_SCALE + 0.3) * Math.cos(theta);
      const nameY = (MAX_SCALE + 0.3) * Math.sin(theta);
      ctx.save();
      ctx.scale(1, -1);
      ctx.fillStyle = "#000";
      ctx.font = "0.035em Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(axisNames[i], nameX, -nameY);
      ctx.restore();
    }

    // from pointScore
    const psFeature = pointScore[0].properties; // example: first point
    const combineArray2 = modelPropSelect[currentModel](psFeature);

    const coords2 = [];
    for (let i = 0; i < combineArray2.length; i++) {
      const theta = (2 * Math.PI * i) / combineArray2.length - Math.PI / 2;
      coords2.push([
        combineArray2[i] * Math.cos(theta),
        combineArray2[i] * Math.sin(theta)
      ]);
    }
    coords2.push(coords2[0]);

    // draw polygon
    drawPolygon(ctx, coords, "#0077ff", true, 0.25);
    drawPolygon(ctx, coords2, "#ff6600", true, 0.25);

    ctx.restore();
  }
});

  map.colorLayer.bringToFront();
  map.pickPointLayer.bringToFront();

  // finish unit step and go to next step
  finishGroupButtonSim.addEventListener('click', () => {
    fileTypeSelectSim.disabled = false;
    downloadButtonSim.disabled = false;
    fromSliderSim.disabled = true;
    toSliderSim.disabled = true;
    fromInputSim.disabled = true;
    toInputSim.disabled = true;
    returnGenerateGroupButtonSim.addEventListener('click', () => {
      returnToSliderGroup();
    });
  });

  window.map = map;
}

// in order to prevent downloading duplicates, the download even listener is outside the whole function to only download once
// download button handeler
downloadButtonSim.addEventListener('click', () => {  
  const geojsonData = window.map.finalSimLayer.toGeoJSON();
  handleDownload(geojsonData, fileTypeSelectSim, shpOptionsSim, 'similarity');
});

// use input range to get the final geojson
function selectSimToGeojson(resolutionCollection, from, to, pointScore, simCalModel) {

  simCalModel(resolutionCollection, pointScore);

  // pick the chunks in the selected range
  const groupArray = [];
  for (let i = 0; i < resolutionCollection.features.length; i++) {
    const eachResScore = resolutionCollection.features[i].properties["similarity"];
    if (eachResScore >= from && eachResScore <= to) {
      groupArray.push(resolutionCollection.features[i]);
    }
  }


  // Calculate the similarity value based on normal final value, need to normalize it to make sure it will be between 0 and 1
  const [minFinal, maxFinal] = getMinMaxFromFeatureArray(groupArray, "similarity");
  // here use power scale
  const scaleFunc = d3.scalePow([minFinal, maxFinal], [0, 1]).exponent(1);
  // const selectPointSimRefScore = scaleFunc(pointScore[0].properties["similarity"]);

  for (let i = 0; i < groupArray.length; i++) {
    groupArray[i].properties.ID = i; // need to update the ID
    groupArray[i].properties["similarity4Color"] = scaleFunc(groupArray[i].properties["similarity"]);
    // // similarity is the absolute difference between the selected point's score and the current score
    // if (groupArray[i].properties.simRefScore !== selectPointSimRefScore) {
    //   groupArray[i].properties.similarity = Math.abs(groupArray[i].properties.simRefScore - selectPointSimRefScore);
    // } else {
    //   groupArray[i].properties.similarity = 1;
    // }
  }

  // // prepare similarity range for color later
  // const [minSim, maxSim] = getMinMaxFromFeatureArray(groupArray, 'similarity');

  // create the geojson structure
  const geojsonCollection = {'type': 'FeatureCollection', 'features': groupArray};

  return [geojsonCollection, minFinal, maxFinal];
}


// Collection of return manipulation

function returnToSliderGroup() {
  fileTypeSelectSim.disabled = true;
  downloadButtonSim.disabled = true;
  fromSliderSim.disabled = false;
  // toSliderSim.disabled = false;
  fromInputSim.disabled = false;
  // toInputSim.disabled = false;
}

function returnToGenerateResSim(map) {
  // enable dropdown boxes
  showModelButton.disabled = false;
  finishShowModel.disabled = false;
  for (const i of dropdownAllSim) {
    i.disabled = false;
  }
  // disable slider buttons

  // return slider to default values
  fromSliderSim.value = 80;
  toSliderSim.value = 100;
  fromInputSim.value = 80;
  toInputSim.value = 100;
  fillSlider(fromSliderSim, toSliderSim, '#C6C6C6', '#c1e2ff', toSliderSim);
  percentageDisplay.textContent = `${fromSliderSim.value}% - ${toSliderSim.value}%`;
  
  fromSliderSim.disabled = true;
  toSliderSim.disabled = true;
  fromInputSim.disabled = true;
  toInputSim.disabled = true;
  generateGroupButtonSim.disabled = true;
  finishGroupButtonSim .disabled = true;
  // map cleanup
  map.fitBounds(map.zoomRefLayer.getBounds());
  if (map.finalSimLayer !== null) {
    map.finalSimLayer.clearLayers();
  }
  // remove similarity area legend
  const legendContent = document.querySelector('.legend-content-sim');
  if (legendContent.querySelector('.similarity-legend') !== null) {
    const oldLegend = legendContent.querySelector('.similarity-legend');
    legendContent.removeChild(oldLegend);
  }
  // remove marker on slider
  const scoreLabel = document.querySelector('.select-point-box-label');
  scoreLabel.style.removeProperty('display');
  scoreLabel.classList.add('hidden');
}

function returnToStartSim(map, coastLine) {
  // enable step 1 buttons
  startButtonSim.disabled = false;
  finishButtonSim.disabled = false;
  // disable step 2 buttons
  showModelButton.disabled = true;
  finishShowModel.disabled = true;
  firstDropSim.value = '';

  for (const i of dropdownAllSim) {
    i.disabled = true;
  }
  // map cleanup
  map.fitBounds(map.zoomRefLayer.getBounds());
  const currentPoint = map.pickPointLayer.toGeoJSON();
  console.log(currentPoint);
  map.pickPointLayer.clearLayers();
  if (map.colorLayer !== null) {
    map.colorLayer.clearLayers();
  }
  // change the selected point back to marker pin
  // need to read point location from pickPointLayer
  const updatedMarker = initializePoints(map, currentPoint.features[0].geometry.coordinates, flagIcon);
  updatedMarker.addEventListener('dragend', () => {
    handleMarkerSnap(coastLine, updatedMarker, map);
  });
  map.legend.remove();
}

// find closest polygon and get properties
function findClosestData(whichData, coastline) {
  const coastlinecenter = turf.pointOnFeature(coastline);
  // need to loop through each shape to get center points because the turf function only take one shape each time

  const centers = whichData.features.map((feature) => {
    const featureCenter = turf.pointOnFeature(feature);
    featureCenter.properties = feature.properties; // add all feature properties to point properties (although we don't need it later)
    return featureCenter;
  });

  // find nearest center point and use that to get the park shape
  const dataNear = turf.nearestPoint(coastlinecenter, turf.featureCollection(centers)); // truf function take turf feature collection, not just simple array

  const prop = [dataNear];
  return prop;
}

// Draw polygon
function drawPolygon(ctx, coords, color, fill=false, alpha=0.25) {
  if (!coords || coords.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i++) ctx.lineTo(coords[i][0], coords[i][1]);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / 40;
  ctx.stroke();
  if (fill) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export {
  handleSimilarityCalculations,
};
