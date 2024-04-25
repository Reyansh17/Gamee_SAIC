import * as THREE from "three";
import { BuildingType } from "./buildings/buildingType.js";
import { createBuilding } from "./buildings/buildingFactory.js";
import { Tile } from "./tile.js";
import { PowerService } from "./services/power.js";
import { SimService } from "./services/simService.js";

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
            // case BuildingType.commercial:
            //   totalRevenue += tile.building.calculateBusinessTax();
            //   break;
            // case BuildingType.industrial:
            //   totalRevenue += tile.building.calculateBusinessTax();
            //   break;
            // Add more cases for other building types
          }
        }
      }
    }
    return totalRevenue;
  }
  updateBudget() {
    if (this.elapsedMinutes % 15 === 0) {
      // Generate revenue every 15 minutes
      const revenue = this.calculateRevenue();
      this.budget += revenue;
      this.updateBudgetDisplay(ui);
      this.elapsedMinutes = 0; // Reset elapsedMinutes
    }
}

  updateBudgetDisplay(ui) {
    console.log("Budget:", this.budget);
    ui.updateBudgetDisplay(this.budget);
  }
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
    mini: 500,
    macro: 700,
    large: 1000,
    bank: 2000,
    firestation: 300,
    Hospital: 500,
    Police : 250,
    School: 500,
    SM: 500,
    Concert: 1500,
    Restaurent: 500,
    TH:0,

  };
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
  // vehicleGraph;

  constructor(size, name = "CITYSCAPE") {
    super();
    this.buildingCooldown = 0;
    this.updateBudgetDisplay(ui); // Update the budget display on initial load
    this.name = name;
    this.size = size;
    this.elapsedMinutes = 0; // Initialize elapsedMinutes to 0

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

    // Place a building at the center of the city
    const centerX = Math.floor(this.size / 2);
    const centerY = Math.floor(this.size / 2);
    this.placeBuilding(centerX, centerY, BuildingType.TH, this);
    
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
    if (
      x === undefined ||
      y === undefined ||
      x < 0 ||
      y < 0 ||
      x >= this.size ||
      y >= this.size
    ) {
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

      // Decrement the buildingCooldown
      if (this.buildingCooldown > 0) {
        this.buildingCooldown--;
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
    if (this.buildingCooldown > 0) {
      console.error(`Cannot place a building during cooldown (remaining: ${this.buildingCooldown} minutes)`);
      return;
    }

    const building = createBuilding(x, y, buildingType, this);
    if (!building) return; // Exit if building creation failed

    const size = building.size;
    const cost = this.buildingCost[buildingType];

    // Check if the city has enough budget
    if (this.budget < cost) {
      console.error(
        `Not enough funds to place ${buildingType} building. Required: ${cost}`
      );
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
      this.buildingCooldown = 3;

    }
  }

  draw() {
    // this.vehicleGraph.updateVehicles();
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

  /**
 * Step the simulation forward by one step
 * @param {number} deltaTime The time elapsed since the last frame in milliseconds
 */
simulate(deltaTime) {
  // Convert deltaTime to seconds
  const deltaSeconds = deltaTime / 1000;

  // Update services
  this.services.forEach((service) => service.simulate(this, deltaSeconds));

  // Update each building
  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      this.getTile(x, y).simulate(this, deltaSeconds);
    }
  }

  // Decrement the buildingCooldown
  if (this.buildingCooldown > 0) {
    this.buildingCooldown -= deltaSeconds;
  }

  // Update the elapsed time
  this.elapsedSeconds += deltaSeconds;

  // Update the simulation time if a second has elapsed
  if (this.elapsedSeconds >= 1) {
    this.simTime += Math.floor(this.elapsedSeconds);
    this.elapsedSeconds = Math.max(0, this.elapsedSeconds - Math.floor(this.elapsedSeconds));

    // Update budget every 15 minutes (900 seconds)
    if (this.simTime % 900 === 0) {
      this.updateBudget();
    }
  }
}

  // simulate(steps = 1) {
  //   let count = 0;
  //   while (count++ < steps) {
  //     // Update services
  //     // this.services.forEach((service)  service.simulate(this));

  //     // Update each building
  //     for (let x = 0; x < this.size; x++) {
  //       for (let y = 0; y < this.size; y++) {
  //         this.getTile(x, y).simulate(this);
  //       }
  //     }

  //     // Update budget
  //     if (count % 10 === 0) {
  //       // Update budget every 10 simulation steps
  //       this.updateBudget();
  //     }
  //   }
  //   this.simTime++;
  // }

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
