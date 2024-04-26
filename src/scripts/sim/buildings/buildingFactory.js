import { BuildingType } from './buildingType.js';
import { CommercialZone } from './zones/commercial.js';
import { ResidentialZone } from './zones/1BHK.js';
import { IndustrialZone } from './zones/industrial.js';
import { Road } from './transportation/road.js';
import { Building } from './building.js';
import { PowerPlant } from './power/powerPlant.js';
import { PowerLine } from './power/powerLine.js';
import { TBHK } from './zones/2BHK.js';
import { CBHK } from './zones/3BHK.js';
import { City } from '../city.js';
/**
 * 
 * Creates a new building object
 * @param {number} x The x-coordinate of the building
 * @param {number} y The y-coordinate of the building
 * @param {string} type The building type
 * @returns {Building} A new building object
 */
export function createBuilding(x, y, type, City) {
  
  switch (type) {
    case BuildingType.residential: 
    const residentialZone = new ResidentialZone(x, y);
    if (City.budget >= residentialZone.buildingCost) {
      City.budget -= residentialZone.buildingCost;
      return new ResidentialZone();
    } else {
      console.error('Insufficient funds to build a residential zone');
    }
    break;
    case BuildingType.commercial: 
      return new CommercialZone();
    case BuildingType.industrial: 
      return new IndustrialZone();
    case BuildingType.road: 
      return new Road();
    case BuildingType.powerPlant:
      return new CBHK();
    case BuildingType.powerLine:
      return new TBHK();
    case BuildingType.TBHK:
      return new TBHK();
    case BuildingType.CBHK:
      return new CBHK();
    default:
      console.error(`${type} is not a recognized building type.`);
  }
}