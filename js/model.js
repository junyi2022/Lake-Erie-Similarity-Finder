/* globals turf */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

import { getResolutionBoxes } from './cal.js';

function coastalProcessCal(coastalProcessing) {
    for (let i = 0; i < coastalProcessing.feature.length; i++) {
        const sedimentNetLoss = coastalProcessing.features[i].properties.CalSedi;
        const retreatRate = coastalProcessing.features[i].properties.CalRetreat;
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
