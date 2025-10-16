/* globals turf */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// calculate coastal processing length
function coastalProcessCal(coastalProcessing, propertiesName) {
  for (let i = 0; i < coastalProcessing.features.length; i++) {
      const sedimentNetLoss = coastalProcessing.features[i].properties.CalSedi;
      const retreatRate = coastalProcessing.features[i].properties.CalRetreat;
      coastalProcessing.features[i].properties[propertiesName] = sedimentNetLoss + retreatRate;
  }
}

function coastalConditionCal(coastalCondition, propertiesName) {
  for (let i = 0; i < coastalCondition.features.length; i++) {
    const slope = coastalCondition.features[i].properties.CalSlope;
    const landcover = coastalCondition.features[i].properties.CalLandcover;
    const shoreType = coastalCondition.features[i].properties.CalShoreType;
    const combineArray = [slope, landcover, shoreType];

    const [combinePolygon, area] = arrayToArea(combineArray);
    coastalCondition.features[i].properties["polygonCoords"] = combinePolygon;
    coastalCondition.features[i].properties[propertiesName] = area;
  }
}

// function combinedModelCal(unit) {

// }

// calculate similarity within model

function coastalProcessSim(resolutionCollection, pointScore) {
  // selected point's CalSedi and CalRetreat
  const pointSediLoss = pointScore[0].properties.CalSedi;
  const pointRetreat = pointScore[0].properties.CalRetreat;
  for (let i = 0; i < resolutionCollection.features.length; i++) {
    const thisSediLoss = resolutionCollection.features[i].properties.CalSedi;
    const thisRetreat = resolutionCollection.features[i].properties.CalRetreat;
    // similarity calculation using the boolean overlap / boolean union method
    const numerator = Math.min(pointSediLoss, thisSediLoss) + Math.min(pointRetreat, thisRetreat);
    const denominator = Math.max(pointSediLoss, thisSediLoss) + Math.max(pointRetreat, thisRetreat);
    coastalProcessing.features[i].properties["similarity"] = numerator/denominator;
  }
}

function coastalConditionSim(resolutionCollection, pointScore) {
  // selected point's values
  const pointSlope = pointScore[0].properties.CalSlope;
  const pointLandcover = pointScore[0].properties.CalLandcover;
  const pointShoreType = pointScore[0].properties.CalShoreType;
  const pointCombineArray = [pointSlope, pointLandcover, pointShoreType];
  const pointPolygon = convertToXY(pointCombineArray); // array of array of coordinates
  for (let i = 0; i < resolutionCollection.features.length; i++) {
    const thisPolygon = resolutionCollection.features[i].properties.polygonCoords;
    
    // similarity calculation using polygon overlap / polygon union method
    const intersection = martinez.intersection(pointPolygon, thisPolygon);
    const intersectionArea = polygonArea(intersection);
    // Calculate union using martinez library
    const union = martinez.union(pointPolygon, thisPolygon);
    const unionArea = polygonArea(union);

    console.log('intersectionArea:', intersectionArea);
    console.log('unionArea:', unionArea);

    coastalCondition.features[i].properties["similarity"] = intersectionArea / unionArea;
  }
}


// supporting functions
// Convert radius array to Cartesian coordinates
function convertToXY(radii) {
  const n = radii.length;
  const coords = [];
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / n - Math.PI/2;
    const r = radii[i];
    coords.push([r * Math.cos(theta), r * Math.sin(theta)]);
  }
  coords.push(coords[0]); // close the polygon
  return [coords];
}

// Shoelace formula for polygon area
function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function arrayToArea(arr) {
  const combinePolygon = convertToXY(arr); // array of array of coordinates
  const area = polygonArea(combinePolygon[0]);
  return [combinePolygon, area];
}

export {
  coastalProcessCal,
  coastalProcessSim,
  coastalConditionCal,
  coastalConditionSim,
//   combinedModelCal
};
