import { Game } from './game';
import { SimObject } from './sim/simObject';
import playIconUrl from '/icons/play-color.png';
import pauseIconUrl from '/icons/pause-color.png';
// import updateBudgetDisplay from './sim/city.js';
  // Get a reference to the budget-value element
  const budgetValueElement = document.getElementById('budget-value');

  // Function to update the budget display

export class GameUI {
  /**
   * Currently selected tool
   * @type {string}
   */
  activeToolId = 'select';
  /**
   * @type {HTMLElement | null }
   */
  selectedControl = document.getElementById('button-select');
  /**
   * True if the game is currently paused
   * @type {boolean}
   */
  isPaused = false;

  get gameWindow() {
    return document.getElementById('render-target');
  }

  showLoadingText() {
    document.getElementById('loading').style.visibility = 'visible';
  }

  hideLoadingText() {
    document.getElementById('loading').style.visibility = 'hidden';
  }
  updateBudgetDisplay() {
    console.log('Budget:', this.budget);
    budgetValueElement.textContent = budget;

  }
  /**
   * 
   * @param {*} event 
   */
  onToolSelected(event) {
    // Deselect previously selected button and selected this one
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = event.target;
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
  }

  /**
   * Toggles the pause state of the game
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      document.getElementById('pause-button-icon').src = playIconUrl;
      document.getElementById('paused-text').style.visibility = 'visible';
    } else {
      document.getElementById('pause-button-icon').src = pauseIconUrl;
      document.getElementById('paused-text').style.visibility = 'hidden';
    }
  }

  /**
 * Updates the values in the title bar, including the simulation time and elapsed time
 * @param {Game} game 
 */
updateTitleBar(game) {
  document.getElementById('city-name').innerHTML = game.city.name;
  document.getElementById('population-counter').innerHTML = game.city.population;

  const updateSimulationTime = () => {
    const currentDate = new Date('1/1/2023');
    currentDate.setSeconds(currentDate.getSeconds() + game.city.simTime);
    document.getElementById('sim-time').innerHTML = currentDate.toLocaleDateString();
  };

  const updateElapsedTime = () => {
    const elapsedTimeElement = document.getElementById('elapsed-time');
    const elapsedSeconds = game.city.simTime;
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    elapsedTimeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update simulation time immediately
  updateSimulationTime();

  // Update simulation time every second
  setInterval(updateSimulationTime, 1000);

  // Update elapsed time immediately and every second
  updateElapsedTime();
  setInterval(updateElapsedTime, 1000);
}


  /**
   * Updates the info panel with the information in the object
   * @param {SimObject} object 
   */
  updateInfoPanel(object) {
    const infoElement = document.getElementById('info-panel')
    if (object) {
      infoElement.style.visibility = 'visible';
      infoElement.innerHTML = object.toHTML();
    } else {
      infoElement.style.visibility = 'hidden';
      infoElement.innerHTML = '';
    }
  }
    updateBudgetDisplay(budget) {
    budgetValueElement.textContent = budget;
  }

}

window.ui = new GameUI();