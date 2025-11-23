/* globals turf, martinez */

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

function combinedModelCal(conditionProcessingCombine, propertiesName) {
    for (let i = 0; i < conditionProcessingCombine.features.length; i++) {
    const slope = conditionProcessingCombine.features[i].properties.CalSlope;
    const landcover = conditionProcessingCombine.features[i].properties.CalLandcov;
    const shoreType = conditionProcessingCombine.features[i].properties.CalShoreTy;
    const sedimentNetLoss = conditionProcessingCombine.features[i].properties.CalSedi;
    const retreatRate = conditionProcessingCombine.features[i].properties.CalRetreat;
    const combineArray = [slope, landcover, shoreType, sedimentNetLoss, retreatRate];

    const [combinePolygon, area] = arrayToArea(combineArray);
    conditionProcessingCombine.features[i].properties["polygonCoords"] = combinePolygon;
    conditionProcessingCombine.features[i].properties[propertiesName] = area;
  }
}

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
  const pointPolygon = pointScore[0].properties.polygonCoords;
  for (let i = 0; i < resolutionCollection.features.length; i++) {
    const thisPolygon = resolutionCollection.features[i].properties.polygonCoords;
    
    // similarity calculation using polygon overlap / polygon union method
    const intersection = martinez.intersection(pointPolygon, thisPolygon);
    const intersectionArea = multiPolygonArea(intersection);
    // Calculate union using martinez library
    const union = martinez.union(pointPolygon, thisPolygon);
    const unionArea = multiPolygonArea(union);

    coastalCondition.features[i].properties["similarity"] = intersectionArea / unionArea;
  }
}

function combinedModelSim(resolutionCollection, pointScore) {
  // selected point's values
  const pointPolygon = pointScore[0].properties.polygonCoords;

  for (let i = 0; i < resolutionCollection.features.length; i++) {
    const thisPolygon = resolutionCollection.features[i].properties.polygonCoords;
    
    // similarity calculation using polygon overlap / polygon union method
    const intersection = martinez.intersection(pointPolygon, thisPolygon);
    const intersectionArea = multiPolygonArea(intersection);

    // Calculate union using martinez library
    const union = martinez.union(pointPolygon, thisPolygon);
    const unionArea = multiPolygonArea(union);

    conditionProcessingCombine.features[i].properties["similarity"] = intersectionArea / unionArea;
  }
}

// canvas component calculations

function coastalProcessPropToArray(f) {
  const sedimentNetLoss = f.CalSedi;
  const retreatRate = f.CalRetreat;

  return [sedimentNetLoss, retreatRate];
}

function coastalConditionPropToArray(f) {
  const slope = f.CalSlope;
  const landcover = f.CalLandcover;
  const shoreType = f.CalShoreType;

  // combine them into an array for radar chart
  return [slope, landcover, shoreType];
}

function combineModelPropToArray(f) {
  const slope = f.CalSlope;
  const landcover = f.CalLandcov;
  const shoreType = f.CalShoreTy;
  const sedimentNetLoss = f.CalSedi;
  const retreatRate = f.CalRetreat;

  // combine them into an array for radar chart
  return [slope, landcover, shoreType, sedimentNetLoss, retreatRate];
}


// supporting functions

// Convert radius array to Cartesian coordinates
function convertToXY(radii) {
  const n = radii.length;
  const coords = [];

  // Normalize radii to a reasonable scale (0.1 to 1.0)
  const maxRadius = Math.max(...radii);
  const scaleFactor = 1.0 / maxRadius;

  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / n - Math.PI/2;
    const r = radii[i] * scaleFactor;
    coords.push([Number(r * Math.cos(theta)), Number(r * Math.sin(theta))]);
  }
  // Close the polygon
  coords.push([coords[0][0], coords[0][1]]);
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

function multiPolygonArea(mp) {
  let total = 0;
  if (!mp) return 0;
  for (const poly of mp) {
    for (const ring of poly) {
      total += polygonArea(ring);
    }
  }
  return total;
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
  combinedModelCal,
  combinedModelSim,
  coastalProcessPropToArray,
  coastalConditionPropToArray,
  combineModelPropToArray
};
