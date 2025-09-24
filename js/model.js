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

// function coastalConditionCal(unit) {
    
// }

// function combinedModelCal(unit) {

// }

export {
  coastalProcessCal,
//   coastalConditionCal,
//   combinedModelCal
};
