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
    const shoreTyoe = coastalCondition.features[i].properties.CalShoreType;
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
    
}

export {
  coastalProcessCal,
  coastalProcessSim,
  coastalConditionCal,
  coastalConditionSim,
//   combinedModelCal
};
