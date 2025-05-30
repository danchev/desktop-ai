// const { ipcRenderer } = require('electron'); // No longer needed due to preload script

const dragContainer = document.querySelector('.drag-container');
let isDragging = false;
let initialMouseX = 0;
let initialMouseY = 0;

dragContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  initialMouseX = e.screenX;
  initialMouseY = e.screenY;
  // Add a class to style the body while dragging (optional)
  document.body.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.screenX - initialMouseX;
    const deltaY = e.screenY - initialMouseY;

    // Send the deltas to the main process using the exposed API
    window.electronAPI.send('move-window', { deltaX, deltaY });

    // Update initial mouse position for the next movement calculation
    // This makes the movement relative to the last mousemove event,
    // effectively moving the window with the cursor.
    initialMouseX = e.screenX;
    initialMouseY = e.screenY;
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    // Remove the styling class (optional)
    document.body.classList.remove('dragging');
  }
});

// Prevent default drag behavior for the drag handle if it's an image or has text
const dragHandle = document.querySelector('.drag-container .drag');
if (dragHandle) {
  dragHandle.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
}
