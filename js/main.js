import { initializeSimilarAreaMap } from './map.js';
import { handleMenuBar } from './control.js';


async function readJSON(path) {
  const data = await fetch(path);
  return await data.json();
}

// read files
// reference layers

const dataBoundary = await readJSON('data/data-boundary.json');

const censusTracts = await readJSON('data/census-tract.json');

const county = await readJSON('data/county.json');

const huc10 = await readJSON('data/HUC10.geojson');

const huc12 = await readJSON('data/HUC12.json');


// working layers
// because the analysis later (turf.intersect) only takes polygon, need to manipulate lines here before adding them

const shorelineBase = await readJSON('data/shoreline-base-to-bridge.geojson');

const sendimentBudget = await readJSON('data/sediment-budget-rrbh.geojson');

const coastalProcessing = await readJSON('data/models/coastal-processing.geojson');

const coastalCondition = await readJSON('data/models/coastal-conditions.geojson');

const conditionProcessingCombine = await readJSON('data/models/condition-processing-combine.geojson');

// reference layers

window.censusTracts = censusTracts;
window.dataBoundary = dataBoundary;
window.county = county;
window.huc10 = huc10;
window.huc12 = huc12;

// working layers
window.sendimentBudget = sendimentBudget;
window.shorelineBase = shorelineBase;
window.coastalProcessing = coastalProcessing;
window.coastalCondition = coastalCondition;
window.conditionProcessingCombine = conditionProcessingCombine;

// map for unit generator
// Other maps shouldn't be called here since they are not shown up at the beginning and have display = none
window.map = initializeSimilarAreaMap(censusTracts, dataBoundary, huc10, huc12, shorelineBase, county, sendimentBudget); // remember to add new layer her as well

// menu bar
handleMenuBar();

export {
  censusTracts, dataBoundary, huc10, huc12, shorelineBase, county,
  sendimentBudget
};
