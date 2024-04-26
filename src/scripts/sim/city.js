import * as THREE from 'three';
import { BuildingType } from './buildings/buildingType.js';
import { createBuilding } from './buildings/buildingFactory.js';
import { Tile } from './tile.js';
import { VehicleGraph } from './vehicles/vehicleGraph.js';
import { PowerService } from './services/power.js';
import { SimService } from './services/simService.js';


export class City extends THREE.Group {
  calculateRevenue() {
    let totalRevenue = 0;
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.getTile(x, y);
        if (tile.building) {
          switch (tile.building.type) {
            case BuildingType.residential:
              totalRevenue += tile.building.generateRevenue();
              break;
            // Add cases for other building types if needed
          }
        }
      }
    }
    return totalRevenue;
  }
  
  updateBudget() {
    const revenue = this.calculateRevenue();
    this.budget += revenue;
    this.updateBudgetDisplay(ui);
  }
  
  
  updateBudgetDisplay(ui) {
    console.log('Budget:', this.budget);
    ui.updateBudgetDisplay(this.budget);
  }
  
  placeBuilding(x, y, buildingType, city) {
    const building = createBuilding(x, y, buildingType, this);
    if (!building) return; // Exit if building creation failed
  
    const size = building.size;
    const cost = this.buildingCost[buildingType];
  
    // Check if the city has enough budget
    if (this.budget < cost) {
      console.error(`Not enough funds to place ${buildingType} building. Required: ${cost}`);
      return;
    }
  
    // Check if there's enough space to place the building
    for (let i = x; i < x + size; i++) {
      for (let j = y; j < y + size; j++) {
        const tile = this.getTile(i, j);
        if (tile && tile.building) {
          // There's already a building on one of the tiles
          return;
        }
      }
    }
  
    // Deduct the cost from the city's budget
    this.budget -= cost;
    this.updateBudgetDisplay(ui); // Update the budget display after deducting the cost
  
    // Place the building across multiple tiles
    for (let i = x; i < x + size; i++) {
      for (let j = y; j < y + size; j++) {
        const tile = this.getTile(i, j);
        tile.setBuilding(building);
        tile.refreshView(this);
      }
    }
  
    // Update neighboring tiles for road connections
    for (let i = x - 1; i <= x + size; i++) {
      for (let j = y - 1; j <= y + size; j++) {
        const tile = this.getTile(i, j);
        if (tile) {
          tile.refreshView(this);
        }
      }
    }
  
    // Display a message indicating that revenue has been generated
    const revenue = this.calculateRevenue();
    if (revenue > 0) {
      this.displayRevenueMessage(revenue);
    }
  }
  
  displayRevenueMessage(revenue) {
    // Display a message indicating the revenue generated
    alert(`Generated revenue: ${revenue}`);
  }
  
  
    // Deduct the
  
  /**
   * Separate group for organizing debug meshes so they aren't included
   * in raycasting checks
   * @type {THREE.Group}
   */
  debugMeshes = new THREE.Group();
  /**
   * Root node for all scene objects 
   * @type {THREE.Group}
   */
  root = new THREE.Group();
  /**
   * The budget of the city
   * @type {number}
   */
  budget = 4000;  

  /** Building costs 
   * */
  buildingCost = { 
    residential: 300,
    TBHK: 500,
    CBHK: 800,
    commercial: 2000,
    industrial: 3000,

  }
  /**
   * List of services for the city
   * @type {SimService}
   */
  services = [];
  /**
   * The size of the city in tiles
   * @type {number}
   */
  size = 25;
  /**
   * The current simulation time
   */
  simTime = 0;
  /**
   * 2D array of tiles that make up the city
   * @type {Tile[][]}
   */
  tiles = [];
  /**
   * 
   * @param {VehicleGraph} size 
   */
  vehicleGraph;

  constructor(size, name = 'CITYSCAPE') {
    super();
    this.updateBudgetDisplay(ui); // Update the budget display on initial load
    this.name = name;
    this.size = size;
    
    this.add(this.debugMeshes);
    this.add(this.root);

    this.tiles = [];
    for (let x = 0; x < this.size; x++) {
      const column = [];
      for (let y = 0; y < this.size; y++) {
        const tile = new Tile(x, y);
        tile.refreshView(this);
        this.root.add(tile);
        column.push(tile);
      }
      this.tiles.push(column);
    }

    this.services = [];
    this.services.push(new PowerService());
    
    this.vehicleGraph = new VehicleGraph(this.size);
    this.debugMeshes.add(this.vehicleGraph);
  }

  /**
   * The total population of the city
   * @type {number}
   */
  get population() {
    let population = 0;
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.getTile(x, y);
        population += tile.building?.residents?.count ?? 0;
      }
    }
    return population;
  }

  /** Returns the title at the coordinates. If the coordinates
   * are out of bounds, then `null` is returned.
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   * @returns {Tile | null}
   */
  getTile(x, y) {
    if (x === undefined || y === undefined ||
      x < 0 || y < 0 ||
      x >= this.size || y >= this.size) {
      return null;
    } else {
      return this.tiles[x][y];
    }
  }

  
  /**
   * Step the simulation forward by one step
   * @type {number} steps Number of steps to simulate forward in time
   */
  simulate(steps = 1) {
    let count = 0;
    while (count++ < steps) {
      // Update services
      this.services.forEach((service) => service.simulate(this));

      // Update each building
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          this.getTile(x, y).simulate(this);
        }
      }
    }
    this.simTime++;
  }

  /**
   * Places a building at the specified coordinates if the
   * tile does not already have a building on it
   * @param {number} x 
   * @param {number} y 
   * @param {string} buildingType 
   */

placeBuilding(x, y, buildingType, city) {
  const building = createBuilding(x, y, buildingType, this);
  if (!building) return; // Exit if building creation failed

  const size = building.size;
  const cost = this.buildingCost[buildingType];

  // Check if the city has enough budget
  if (this.budget < cost) {
    console.error(`Not enough funds to place ${buildingType} building. Required: ${cost}`);
    return;
  }

  // Check if there's enough space to place the building
  for (let i = x; i < x + size; i++) {
    for (let j = y; j < y + size; j++) {
      const tile = this.getTile(i, j);
      if (tile && tile.building) {
        // There's already a building on one of the tiles
        return;
      }
    }
  }

  // Deduct the cost from the city's budget
  this.budget -= cost;
  this.updateBudgetDisplay(ui); // Update the budget display after deducting the cost

  // Place the building across multiple tiles
  for (let i = x; i < x + size; i++) {
    for (let j = y; j < y + size; j++) {
      const tile = this.getTile(i, j);
      tile.setBuilding(building);
      tile.refreshView(this);
    }
  }

  // Update neighboring tiles for road connections
  for (let i = x - 1; i <= x + size; i++) {
    for (let j = y - 1; j <= y + size; j++) {
      const tile = this.getTile(i, j);
      if (tile) {
        tile.refreshView(this);
      }
    }
  }
}

bulldoze(x, y) {
  const tile = this.getTile(x, y);

  if (tile.building) {
    const size = tile.building.size;

    if (tile.building.type === BuildingType.road) {
      this.vehicleGraph.updateTile(x, y, null);
    }

    // Remove the building from multiple tiles
    for (let i = x; i < x + size; i++) {
      for (let j = y; j < y + size; j++) {
        const tile = this.getTile(i, j);
        tile.building.dispose();
        tile.setBuilding(null);
        tile.refreshView(this);
      }
    }

    // Update neighboring tiles for road connections
    for (let i = x - 1; i <= x + size; i++) {
      for (let j = y - 1; j <= y + size; j++) {
        const tile = this.getTile(i, j);
        if (tile) {
          tile.refreshView(this);
        }
      }
    }
  }
}

  draw() {
    this.vehicleGraph.updateVehicles();
  }

  /**
   * Finds the first tile where the criteria are true
   * @param {{x: number, y: number}} start The starting coordinates of the search
   * @param {(Tile) => (boolean)} filter This function is called on each
   * tile in the search field until `filter` returns true, or there are
   * no more tiles left to search.
   * @param {number} maxDistance The maximum distance to search from the starting tile
   * @returns {Tile | null} The first tile matching `criteria`, otherwiser `null`
   */
  findTile(start, filter, maxDistance) {
    const startTile = this.getTile(start.x, start.y);
    const visited = new Set();
    const tilesToSearch = [];

    // Initialze our search with the starting tile
    tilesToSearch.push(startTile);

    while (tilesToSearch.length > 0) {
      const tile = tilesToSearch.shift();

      // Has this tile been visited? If so, ignore it and move on
      if (visited.has(tile.id)) {
        continue;
      } else {
        visited.add(tile.id);
      }

      // Check if tile is outside the search bounds
      const distance = startTile.distanceTo(tile);
      if (distance > maxDistance) continue;

      // Add this tiles neighbor's to the search list
      tilesToSearch.push(...this.getTileNeighbors(tile.x, tile.y));

      // If this tile passes the criteria 
      if (filter(tile)) {
        return tile;
      }
    }

    return null;
  }

  simulate(steps = 1) {
    let count = 0;
    while (count++ < steps) {
      // Update services
      // this.services.forEach((service) => service.simulate(this));
  
      // Update each building
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          this.getTile(x, y).simulate(this);
        }
      }
  
      // Update budget
      if (count % 10 === 0) { // Update budget every 10 simulation steps
        this.updateBudget();
      }
    }
    this.simTime++;
  }
  
  /**
   * Finds and returns the neighbors of this tile
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   */
  getTileNeighbors(x, y) {
    const neighbors = [];

    if (x > 0) {
      neighbors.push(this.getTile(x - 1, y));
    }
    if (x < this.size - 1) {
      neighbors.push(this.getTile(x + 1, y));
    }
    if (y > 0) {
      neighbors.push(this.getTile(x, y - 1));
    }
    if (y < this.size - 1) {
      neighbors.push(this.getTile(x, y + 1));
    }

    return neighbors;
  }
}