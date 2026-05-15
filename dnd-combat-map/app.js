document.addEventListener("DOMContentLoaded", () => {

const board = document.getElementById("board");
const canvas = board;
const ctx = canvas.getContext("2d");

const tokenName = document.getElementById("tokenName");
const tokenColor = document.getElementById("tokenColor");
const tokenBonus = document.getElementById("tokenBonus");
const dice = document.getElementById("dice");
const nextTurn = document.getElementById("nextTurn");
const resetMove = document.getElementById("resetMove");
let currentEditItemId = null;
const resetAllMove = document.getElementById("resetAllMove");
const movementInfo = document.getElementById("movementInfo");
const startCombat = document.getElementById("startCombat");
const finishCombat = document.getElementById("finishCombat");
const initiativeRoll = document.getElementById("initiativeRoll");
const editGridLength = document.getElementById("editGridLength");
const editGridHeight = document.getElementById("editGridHeight");
const gridLengthInput = document.getElementById("gridLengthInput");
const gridHeightInput = document.getElementById("gridHeightInput");
const tooltip = document.getElementById("tooltip");


canvas.width = 800;
canvas.height = 800;

let state = {
  tokens: [],
  objects: [],
  initiative: [],
  currentTurn: 0,
  selected: null,
  grid: 40,
  gridLengthFt: 20,
  gridHeightFt: 20,
  combatStarted: false,
  combatStartPositions: {},
  movement: {
    used: 0,
    startX: 0,
    startY: 0,
    activeTokenId: null
  },
  settledDiceRoll: null,
  waypoints: [],
  insightCounter: 0,
  xpCounter: 0
};

function calculateGridDimensions() {
  const pixelSize = state.grid;
  const canvasWidth = state.gridLengthFt * pixelSize;
  const canvasHeight = state.gridHeightFt * pixelSize;
  
  return {
    lengthFt: state.gridLengthFt,
    heightFt: state.gridHeightFt,
    pixelSize: pixelSize,
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight
  };
}

function applyGridDimensions() {
  const dims = calculateGridDimensions();
  canvas.width = dims.canvasWidth;
  canvas.height = dims.canvasHeight;
}

function updateGridButtonStates() {
  const canEdit = state.tokens.length === 0 && !state.combatStarted;
  editGridLength.disabled = !canEdit;
  editGridHeight.disabled = !canEdit;
}

editGridLength.onclick = () => {
  const newLength = parseInt(gridLengthInput.value, 10);
  if (isNaN(newLength) || newLength < 1) {
    alert("Please enter a valid number greater than 0.");
    const dims = calculateGridDimensions();
    gridLengthInput.value = dims.lengthFt;
    return;
  }
  state.gridLengthFt = newLength;
  render();
};

editGridHeight.onclick = () => {
  const newHeight = parseInt(gridHeightInput.value, 10);
  if (isNaN(newHeight) || newHeight < 1) {
    alert("Please enter a valid number greater than 0.");
    const dims = calculateGridDimensions();
    gridHeightInput.value = dims.heightFt;
    return;
  }
  state.gridHeightFt = newHeight;
  render();
}

function drawGrid() {
  for (let x = 0; x < canvas.width; x += state.grid) {
    for (let y = 0; y < canvas.height; y += state.grid) {
      ctx.strokeRect(x, y, state.grid, state.grid);
    }
  }
  ctx.strokeStyle = "black";
}

function createToken(name, color, bonus = 0, tokenSize = 'small') {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    x: 5,
    y: 5,
    direction: 0,
    conditions: [],
    initBonus: bonus,
    startX: 5,
    startY: 5,
    turnStartX : 5,
    turnStartY : 5,
    tokenSize
  };
}


const addTokenbtn = document.getElementById("addToken");
if (addTokenbtn) {
  addTokenbtn.onclick = () => {
  const name = tokenName.value.trim();
  const color = tokenColor.value;
  const bonus = parseInt(tokenBonus.value, 10) || 0;
  const tokenSize = document.getElementById("tokenSize").value;

  if (!name) { return alert("Please enter a name for the token."); }
  if (!color) { return alert("Please select a color for the token."); }
  if (isNaN(bonus)) { return alert("Please enter a valid bonus for the token."); }

  const token = createToken(name, color, bonus, tokenSize);
  state.tokens.push(token);

  // Generate the actual roll once
  const roll = Math.floor(Math.random() * 20) + 1;
  
  animateRoll(roll, () => {
    const total = roll + token.initBonus;

    state.initiative.push({
      id: token.id,
      value: total,
      roll,
      bonus: token.initBonus
    });

    state.initiative.sort((a, b) => b.value - a.value);
    render();
  });
};
}


const addObjectbtn = document.getElementById("addObject");
if (addObjectbtn) {
  addObjectbtn.onclick = () => {
  document.getElementById("objectModal").style.display = "block";
};
}

function animateRoll(actualRoll, callback) {
  let i = 10;
  let rotationX = 0;
  let rotationY = 0;
  let rotationZ = 0;

  let interval = setInterval(() => {
    rotationX += Math.random() * 0.5;
    rotationY += Math.random() * 0.5;
    rotationZ += Math.random() * 0.5;
    
    // Show random numbers during animation, end with actual roll
    const displayNumber = i <= 1 ? actualRoll : Math.floor(Math.random() * 20) + 1;
    drawDice(rotationX, rotationY, rotationZ, displayNumber);
    i--;

    if (i <= 0) {
      clearInterval(interval);
      state.settledDiceRoll = actualRoll;
      drawSettledDice(actualRoll);
      callback();
    }
  }, 50);
}

function drawSettledDice(number) {
  const canvas = document.getElementById('dice');
  const ctx = canvas.getContext('2d');
  const size = 30;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Draw cube faces (no rotation)
  ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
  ctx.fillRect(-size, -size, size * 2, size * 2);
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size, -size, size * 2, size * 2);
  
  // Draw number on face
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number, 0, 0);
  
  ctx.restore();
}

function drawDice(rotX, rotY, rotZ, number) {
  const canvas = document.getElementById('dice');
  const ctx = canvas.getContext('2d');
  const size = 30;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Apply rotations
  ctx.rotate(rotZ);
  
  // Draw cube faces
  ctx.fillStyle = 'rgba(200, 50, 50, 0.9)';
  ctx.fillRect(-size, -size, size * 2, size * 2);
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size, -size, size * 2, size * 2);
  
  // Draw number on face
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number, 0, 0);
  
  ctx.restore();
}

function renderInitiative() {
  const list = document.getElementById("initiativeList");
  list.innerHTML = "";

  state.initiative.forEach((entry, i) => {
    const token = [...state.tokens]
      .reverse()
      .find(t => t.id === entry.id);

    const div = document.createElement("div");
    div.className = "initiativeRow";

    if (i === state.currentTurn) {
      div.classList.add("currentTurn");
    }

    div.innerText =
      `${token.name} (${entry.roll} + ${entry.bonus} = ${entry.value}) `;

    list.appendChild(div);
  });
}

startCombat.onclick = () => {
  if (state.combatStarted) {
    alert("Combat has already begun!");
    return;
  }

  state.combatStarted = true;
  state.combatStartPositions = state.tokens.reduce((acc, token) => {
    acc[token.id] = { x: token.x, y: token.y };
    token.startX = token.x;
    token.startY = token.y;
    token.turnStartX = token.x;
    token.turnStartY = token.y;
    return acc;
  }, {});

  state.currentTurn = 0;
  state.movement.used = 0;
  state.movement.activeTokenId = state.initiative[0]?.id ?? null;

  render();
};

finishCombat.onclick = () => {
  if (!state.combatStarted) {
    alert("There is no active combat!");
    return;
  }

  // Restore tokens that existed when combat started
  state.tokens.forEach(token => {
    const startPos = state.combatStartPositions[token.id];
    if (startPos) {
      token.x = startPos.x;
      token.y = startPos.y;
    }
  });

  state.combatStarted = false;
  state.currentTurn = 0;
  state.movement.used = 0;
  state.movement.activeTokenId = null;
  state.initiative = [];
  state.settledDiceRoll = null;
  state.combatStartPositions = {};
  render();
};

initiativeRoll.onclick = () => {
  state.initiative = [];
  
  state.tokens.forEach(token => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + token.initBonus;
    
    state.initiative.push({
      id: token.id,
      value: total,
      roll,
      bonus: token.initBonus
    });
  });
  
  state.initiative.sort((a, b) => b.value - a.value);
  state.currentTurn = 0;
  state.movement.used = 0;
  state.movement.activeTokenId = state.initiative[0]?.id ?? null;
  render();
};

nextTurn.onclick = () => {
  if (state.initiative.length === 0) return;

  state.currentTurn = (state.currentTurn + 1) % state.initiative.length;
  state.movement.used = 0;
  state.movement.activeTokenId = state.initiative[state.currentTurn]?.id ?? null;

  // Save turn start position for all tokens
  state.tokens.forEach(token => {
    token.turnStartX = token.x;
    token.turnStartY = token.y;
  });

  const active = state.tokens.find(t => t.id === state.movement.activeTokenId);
  if (active) {
    state.movement.startX = active.x;
    state.movement.startY = active.y;
  }

  render();
};

canvas.addEventListener("mousedown", (e) => {
  const x = Math.floor(e.offsetX / state.grid);
  const y = Math.floor(e.offsetY / state.grid);

  const token = [...state.tokens]
    .reverse()
    .find(t => t.x === x && t.y === y);
  if (token) {
    state.selected = token;
    state.movement.activeTokenId = token.id;
    return;
  }

  const object = [...state.objects]
    .reverse()
    .find(o => o.x === x && o.y === y);

  if (object) {
    state.selected = object;
    return;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.selected) return;

  const x = Math.floor(e.offsetX / state.grid);
  const y = Math.floor(e.offsetY / state.grid);

  state.selected.x = x;
  state.selected.y = y;

  // Only track movement for tokens
  if (state.tokens.includes(state.selected)) {
    const dx = x - state.selected.turnStartX;
    const dy = y - state.selected.turnStartY;
    state.movement.used = (Math.abs(dx) + Math.abs(dy)) * 5;
  }

  render();
});

canvas.addEventListener("mouseup", () => {
  state.selected = null;
});

function resetMovement() {
  const activeId =
    state.movement.activeTokenId || state.initiative[state.currentTurn]?.id;
  const t = state.tokens.find(token => token.id === activeId);

  if (!t) return;

  t.x = t.turnStartX;
  t.y = t.turnStartY;
  state.movement.used = 0;

  // to ensure future movement starts fresh
  state.movement.startX = t.x;
  state.movement.startY = t.y;
}

resetMove.onclick = () => {
  resetMovement();
  render();
};

resetAllMove.onclick = () => {
  state.tokens.forEach(token => {
    token.x = token.turnStartX;
    token.y = token.turnStartY;
  });
  state.movement.used = 0;
  render();
};

function drawSight(token) {
  const size = state.grid;

  const cx = token.x * size + size / 2;
  const cy = token.y * size + size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);

  ctx.arc(
    cx,
    cy,
    150,
    token.direction - Math.PI / 3,
    token.direction + Math.PI / 3
  );

  ctx.fillStyle = token.color;
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.restore();
}

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  const token = [...state.tokens]
    .reverse()
    .find(t => t.x === gridX && t.y === gridY);
  const object = [...state.objects]
    .reverse()
    .find(o => o.x === gridX && o.y === gridY);

  if (token) {
    // 🔴 HOLD SHIFT TO DELETE
    if (e.shiftKey) {
      // remove from tokens
      state.tokens = state.tokens.filter(t => t.id !== token.id);

      // remove from initiative
      state.initiative = state.initiative.filter(i => i.id !== token.id);

      // fix turn index
      if (state.currentTurn >= state.initiative.length) {
        state.currentTurn = 0;
      }

      render();
      return;
    }

    // 🟢 otherwise rotate (normal behavior)

    const dx = e.offsetX - (token.x * state.grid + state.grid / 2);
    const dy = e.offsetY - (token.y * state.grid + state.grid / 2);

    token.direction = Math.atan2(dy, dx);

    render();
  } else if (object) {
    // For objects, only delete on shift+right-click
    if (e.shiftKey) {
      state.objects = state.objects.filter(o => o.id !== object.id);
      render();
    }
  }
});

canvas.addEventListener("dblclick", (e) => {
  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  const token = [...state.tokens]
    .reverse()
    .find(t => t.x === gridX && t.y === gridY);

  if (!token) return;

  const input = prompt(
    "Enter conditions (comma separated):",
    token.conditions.join(", ")
  );

  if (input !== null) {
    token.conditions = input
      .split(",")
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }

  render();
});

// Shift + Left Click to copy token/object
canvas.addEventListener("mousedown", (e) => {

  // Shift + Left Click only
  if (!e.shiftKey || e.button !== 0) return;

  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  // Check token first
  const token = [...state.tokens]
    .reverse()
    .find(t => t.x === gridX && t.y === gridY);

  if (token) {

    copyToken(token);

    render();

    return;
  }

  // Check objects
  const object = [...state.objects]
    .reverse()
    .find(o => o.x === gridX && o.y === gridY);

  if (object) {

    copyObject(object);

    render();
  }

});

// Ctrl + Left Click to bring token/object to front
canvas.addEventListener("mousedown", (e) => {

  if (!e.ctrlKey || e.button !== 0) return;

  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  const token = [...state.tokens]
    .reverse()
    .find(t => t.x === gridX && t.y === gridY);

  const object = [...state.objects]
    .reverse()
    .find(o => o.x === gridX && o.y === gridY);

  if (token) {
    bringTokenToFront(token);
    render();
    return;
  }

  if (object) {
    bringObjectToFront(object);
    render();
  }
});

function drawEntities() {
  // Draw tokens
  state.tokens.forEach(t => {
    const size = state.grid;

     const cx = t.x * size + size / 2;
     const cy = t.y * size + size / 2;

    // Calculate token radius based on size option
    let radius;
    if (t.tokenSize === 'default') {
      radius = size / 2;
    } else if (t.tokenSize === 'fat') {
      radius = size * 3 / 4;
    } else if (t.tokenSize === 'fat+') {
      radius = size * Math.sqrt(2);
    } else {
      radius = size / 3;
    }

    // token
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 🔥 direction line
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(t.direction) * 20,
      cy + Math.sin(t.direction) * 20
    );
    ctx.stroke();

    drawSight(t);
  });

  // Draw objects
  state.objects.forEach(o => {
    const size = state.grid;
    const cx = o.x * size + size / 2;
    const cy = o.y * size + size / 2;

    const scale = o.size === 'small' ? 0.25 : o.size === 'medium' ? 0.5 : 1;
    const objSize = size * scale;

    ctx.fillStyle = o.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    if (o.form === 'circle') {
      ctx.beginPath();
      ctx.arc(cx, cy, objSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (o.form === 'square') {
      ctx.fillRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    } else if (o.form === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - objSize / 2);
      ctx.lineTo(cx - objSize / 2, cy + objSize / 2);
      ctx.lineTo(cx + objSize / 2, cy + objSize / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (o.form === 'horizontalStripes') {
      const stripeHeight = objSize / 8;
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? o.color : 'white';
        ctx.fillRect(cx - objSize / 2, cy - objSize / 2 + i * stripeHeight, objSize, stripeHeight);
      }
      ctx.strokeStyle = "black";
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    } else if (o.form === 'verticalStripes') {
      const stripeWidth = objSize / 8;
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? o.color : 'white';
        ctx.fillRect(cx - objSize / 2 + i * stripeWidth, cy - objSize / 2, stripeWidth, objSize);
      }
      ctx.strokeStyle = "black";
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    } else if (o.form === 'diagonalStripesRight') {
      ctx.fillStyle = o.color;
      ctx.fillRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      for (let i = -objSize / 2; i <= objSize / 2; i += objSize / 8) {
        ctx.beginPath();
        ctx.moveTo(cx - objSize / 2, cy + i);
        ctx.lineTo(cx + objSize / 2, cy + i + objSize);
        ctx.stroke();
      }
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    } else if (o.form === 'diagonalStripesLeft') {
      ctx.fillStyle = o.color;
      ctx.fillRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      for (let i = -objSize / 2; i <= objSize / 2; i += objSize / 8) {
        ctx.beginPath();
        ctx.moveTo(cx + objSize / 2, cy + i);
        ctx.lineTo(cx - objSize / 2, cy + i + objSize);
        ctx.stroke();
      }
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    } else if (o.form === 'wavy') {
      const stripeHeight = objSize / 8;
      const amplitude = stripeHeight * 0.3;
      ctx.fillStyle = o.color;
      
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = o.color;
          ctx.fillRect(cx - objSize / 2, cy - objSize / 2 + i * stripeHeight, objSize, stripeHeight);
        } else {
          ctx.fillStyle = 'white';
          ctx.fillRect(cx - objSize / 2, cy - objSize / 2 + i * stripeHeight, objSize, stripeHeight);
        }
      }
      
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const y = cy - objSize / 2 + (i + 1) * stripeHeight;
        for (let x = cx - objSize / 2; x <= cx + objSize / 2; x += 2) {
          const waveOffset = Math.sin((x - cx) / objSize * Math.PI) * amplitude;
          ctx.lineTo(x, y + waveOffset);
        }
        ctx.stroke();
      }
      
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - objSize / 2, cy - objSize / 2, objSize, objSize);
    }
  });
}

function renderTokensPanel() {
  const container = document.getElementById("tokensList");
  container.innerHTML = "";

  state.tokens.forEach(token => {
    const div = document.createElement("div");

    div.className = "tokenItem";

    div.innerHTML =
      `<span style="color:${token.color}">
        ${token.name}
      </span>
      [${token.conditions.join(", ")}]`;

    container.appendChild(div);
  });
}

function updateTooltip() {
  if (!state.combatStarted) {
    tooltip.innerText = "No combat started";
    return;
  }

  const activeId = state.initiative[state.currentTurn]?.id;
  const activeToken = state.tokens.find(t => t.id === activeId);

  const turnText = `Turn ${state.currentTurn + 1}/${state.initiative.length}`;
  const movedText = `Moved: ${state.movement.used} ft`;

  if (!activeToken) {
    tooltip.innerText = `${turnText} | No active token | ${movedText}`;
    return;
  }

  tooltip.innerHTML = "";
  const turnSpan = document.createElement("span");
  turnSpan.textContent = `${turnText} | `;

  const activeSpan = document.createElement("span");
  activeSpan.textContent = `Active: ${activeToken.name}`;
  activeSpan.style.color = activeToken.color;

  const movedSpan = document.createElement("span");
  movedSpan.textContent = ` | ${movedText}`;

  tooltip.appendChild(turnSpan);
  tooltip.appendChild(activeSpan);
  tooltip.appendChild(movedSpan);
}

function render() {
  applyGridDimensions();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawEntities();
  renderInitiative();
  renderTokensPanel();
  updateTooltip();
  updateGridButtonStates();

  movementInfo.innerText = state.movement.used + " ft";
}

const toggleLegend = document.getElementById("toggleLegend");
const legend = document.getElementById("legend");

function setLegendCollapsed(collapsed) {
  legend.classList.toggle("collapsed", collapsed);
  toggleLegend.textContent = collapsed ? "+" : "−";
  toggleLegend.setAttribute("aria-expanded", String(!collapsed));
}

toggleLegend.onclick = () => {
  setLegendCollapsed(!legend.classList.contains("collapsed"));
};

// Preset Management
function loadPresetsFromStorage() {
  const stored = localStorage.getItem("objectPresets");
  return stored ? JSON.parse(stored) : {};
}

function savePresetsToStorage(presets) {
  localStorage.setItem("objectPresets", JSON.stringify(presets));
}

function populatePresetDropdown() {
  const presets = loadPresetsFromStorage();
  const dropdown = document.getElementById("objectPreset");
  
  // Clear existing options except the first one
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  Object.keys(presets).forEach(presetName => {
    const option = document.createElement("option");
    option.value = presetName;
    option.textContent = presetName;
    dropdown.appendChild(option);
  });
}

document.getElementById("objectPreset").onchange = () => {
  const presetName = document.getElementById("objectPreset").value;
  if (!presetName) return;
  
  const presets = loadPresetsFromStorage();
  const preset = presets[presetName];
  
  document.getElementById("objectName").value = preset.name;
  document.getElementById("objectColor").value = preset.color;
  document.getElementById("objectSize").value = preset.size;
  document.getElementById("objectForm").value = preset.form;
};


 const saveAsPresetbtn = document.getElementById("saveAsPreset");
if (saveAsPresetbtn) {
  saveAsPresetbtn.onclick = () => {
  const name = document.getElementById("objectName").value.trim();
  const presetName = prompt("Enter preset name:", name);
  
  if (!presetName) return;
  
  const presets = loadPresetsFromStorage();
  
  if (presets[presetName]) {
    return alert(`A preset named "${presetName}" already exists!`);
  }
  
  presets[presetName] = {
    name: document.getElementById("objectName").value,
    color: document.getElementById("objectColor").value,
    size: document.getElementById("objectSize").value,
    form: document.getElementById("objectForm").value
  };
  
  savePresetsToStorage(presets);
  populatePresetDropdown();
  alert(`Preset "${presetName}" saved!`);
};
}


const removePresetbtn = document.getElementById("removePreset");
if (removePresetbtn) {
  removePresetbtn.onclick = () => {
  const presetName = document.getElementById("objectPreset").value;
  
  if (!presetName) {
    return alert("Please select a preset to remove.");
  }
  
  if (!confirm(`Are you sure you want to remove the preset "${presetName}"?`)) {
    return;
  }
  
  const presets = loadPresetsFromStorage();
  delete presets[presetName];
  
  savePresetsToStorage(presets);
  populatePresetDropdown();
  document.getElementById("objectPreset").value = "";
  alert(`Preset "${presetName}" removed!`);
};
}


const inventorybtn = document.getElementById("inventory");
if (inventorybtn) {
  inventorybtn.onclick = () => {
  closeAllModals();
  document.getElementById("inventoryModal").style.display = "block";
  populateCharactersList(); // optional
  populateItemNameSuggestions();
  loadCharacterBoxes();
  setupInventoryModalHandlers();
  syncInventoryUI();
  syncCharacterUI();
};
}


const waypointsbtn = document.getElementById("waypoints");
if (waypointsbtn) {
  waypointsbtn.onclick = () => {
  closeAllModals();
  document.getElementById("waypointsModal").style.display = "block";
  loadWaypoints();
};
}


const charactersMgmtbtn = document.getElementById("charactersMgmt");
if (charactersMgmtbtn) {
  charactersMgmtbtn.onclick = () => {
    document.getElementById("inventoryModal").style.display = "none";
    document.getElementById("charactersModal").style.display = "block";
    populateCharactersList();

  };
}


const backFromCharactersbtn = document.getElementById("backFromCharacters");
if (backFromCharactersbtn) {
  backFromCharactersbtn.onclick = () => {
  document.getElementById("charactersModal").style.display = "none";
  document.getElementById("inventoryModal").style.display = "block";
};
  syncInventoryUI();
  syncCharacterUI();
}


const closeCharactersModalbtn = document.getElementById("closeCharactersModal");
if (closeCharactersModalbtn) {
  closeCharactersModalbtn.onclick = () => {
    document.getElementById("charactersModal").style.display = "none";
  };
  syncInventoryUI();
  syncCharacterUI();
}


const viewAllbtn = document.getElementById("viewAll");
if (viewAllbtn) {
  viewAllbtn.onclick = () => {
  populateItemNameSuggestions();
  document.getElementById("inventoryModal").style.display = "none";
  document.getElementById("viewAllModal").style.display = "block";
  loadAllCharactersInventory();
};
}


const backToInventorybtn = document.getElementById("backToInventory");
if (backToInventorybtn) {
  backToInventorybtn.onclick = () => {
  document.getElementById("viewAllModal").style.display = "none";
  document.getElementById("inventoryModal").style.display = "block";
};
  syncInventoryUI();
  syncCharacterUI();
}


const closeInventorybtn = document.getElementById("closeInventory");
if (closeInventorybtn) {
  closeInventorybtn.onclick = () => {
  document.getElementById("inventoryModal").style.display = "none";
};
}


const closeWaypointsbtn = document.getElementById("closeWaypoints");
if (closeWaypointsbtn) {
  closeWaypointsbtn.onclick = () => {
  document.getElementById("waypointsModal").style.display = "none";
};
}


const addWaypointbtn = document.getElementById("addWaypoint");
if (addWaypointbtn) {
  addWaypointbtn.onclick = () => {
  const name = document.getElementById("waypointNameInput").value.trim();
  const description = document.getElementById("waypointDescriptionInput").value.trim();
  
  if (!name) {
    alert("Please enter a waypoint name.");
    return;
  }
  
  state.waypoints.push({
    id: crypto.randomUUID(),
    name: name,
    description: description || ""
  });
  
  saveWaypoints();
  document.getElementById("waypointNameInput").value = "";
  document.getElementById("waypointDescriptionInput").value = "";
  loadWaypoints();
};
}

// Counter event listeners
document.getElementById("insightCounter").addEventListener("input", (e) => {
  state.insightCounter = parseInt(e.target.value) || 0;
  saveCounters();
});

document.getElementById("xpCounter").addEventListener("input", (e) => {
  state.xpCounter = parseInt(e.target.value) || 0;
  saveCounters();
});


const backFromCharacterDetailbtn = document.getElementById("backFromCharacterDetail");
if (backFromCharacterDetailbtn) {
  backFromCharacterDetailbtn.onclick = () => {
  document.getElementById("characterDetailModal").style.display = "none";
  document.getElementById("inventoryModal").style.display = "block";
};
  syncInventoryUI();
  syncCharacterUI();
}


const closeCharacterDetailModalbtn = document.getElementById("closeCharacterDetailModal");
if (closeCharacterDetailModalbtn) {
  closeCharacterDetailModalbtn.onclick = () => {
  document.getElementById("characterDetailModal").style.display = "none";
};
}


const closeViewAllbtn = document.getElementById("closeViewAll");
if (closeViewAllbtn) {
  closeViewAllbtn.onclick = () => {
  document.getElementById("viewAllModal").style.display = "none";
};
}


const tutorialButton = document.getElementById("tutorialButton");
if (tutorialButton) {
  tutorialButton.onclick = () => {
  closeAllModals();
  document.getElementById("tutorialModal").style.display = "block";
};
}


const closeTutorialbtn = document.getElementById("closeTutorial");
if (closeTutorialbtn) {
  closeTutorialbtn.onclick = () => {
  document.getElementById("tutorialModal").style.display = "none";
};
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllModals();
  }
});


const itemsManagerbtn = document.getElementById("itemsManager");
if (itemsManagerbtn) {
  itemsManagerbtn.onclick = () => {
  document.getElementById("inventoryModal").style.display = "none";
  document.getElementById("itemManagerModal").style.display = "block";
  currentEditItemId = null;
  document.getElementById("itemNameInput").value = "";
  document.getElementById("itemDescriptionInput").value = "";
  document.getElementById("saveItem").textContent = "Add Item";
  document.getElementById("cancelItemEdit").style.display = "none";
  populateItemManager();
};
}


const backFromItemsbtn = document.getElementById("backFromItems");
if (backFromItemsbtn) {
  backFromItemsbtn.onclick = () => {
  document.getElementById("itemManagerModal").style.display = "none";
  document.getElementById("inventoryModal").style.display = "block";
};
  syncInventoryUI();
  syncCharacterUI();
}


const closeItemManagerbtn = document.getElementById("closeItemManager");
if (closeItemManagerbtn) {
  closeItemManagerbtn.onclick = () => {
  document.getElementById("itemManagerModal").style.display = "none";
};
}


const cancelItemEditbtn = document.getElementById("cancelItemEdit");
if (cancelItemEditbtn) {
  cancelItemEditbtn.onclick = () => {
  currentEditItemId = null;
  document.getElementById("itemNameInput").value = "";
  document.getElementById("itemDescriptionInput").value = "";
  document.getElementById("saveItem").textContent = "Add Item";
  document.getElementById("cancelItemEdit").style.display = "none";
};
}


const saveItembtn = document.getElementById("saveItem");
if (saveItembtn) {
  saveItembtn.onclick = () => {
  const name = document.getElementById("itemNameInput").value.trim();
  const description = document.getElementById("itemDescriptionInput").value.trim();
  if (!name || !description) {
    return alert("Please enter both name and description.");
  }

  const items = loadItemDefinitions();
  const existing = items.find(item => item.name.toLowerCase() === name.toLowerCase());

  if (currentEditItemId) {
    const item = items.find(item => item.id === currentEditItemId);
    if (!item) return;
    if (existing && existing.id !== currentEditItemId) {
      return alert("An item with that name already exists.");
    }
    item.name = name;
    item.description = description;
  } else {
    if (existing) {
      return alert("An item with that name already exists.");
    }
    items.push({ id: crypto.randomUUID(), name, description });
  }

  saveItemDefinitions(items);
  populateItemManager();
  populateItemNameSuggestions(); // Update datalist suggestions
  document.getElementById("itemNameInput").value = "";
  document.getElementById("itemDescriptionInput").value = "";
  currentEditItemId = null;
  document.getElementById("saveItem").textContent = "Add Item";
  document.getElementById("cancelItemEdit").style.display = "none";
  if (!currentEditItemId) {
    alert(`Item ${name} added to items.`);
  }
};
}


const exportInventorybtn = document.getElementById("exportInventory");

if (exportInventorybtn) {

  exportInventorybtn.onclick = () => {

    try {

      const saveData = {

        version: 1,
        exportedAt: Date.now(),

        inventory: loadInventoryData(),

        itemDefinitions: loadItemDefinitions(),

        counters: {
          insight: state.insightCounter,
          xp: state.xpCounter
        },

        waypoints: state.waypoints,

        objectPresets: loadObjectPresets(),

        board: {
          tokens: state.tokens,
          objects: state.objects,
          initiative: state.initiative,
          currentTurn: state.currentTurn,
          combatStarted: state.combatStarted,

          grid: {
            width: state.gridWidth,
            height: state.gridHeight
          }
        }
      };

      const jsonString = JSON.stringify(saveData, null, 2);

      const blob = new Blob(
        [jsonString],
        { type: 'application/json;charset=utf-8' }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;
      a.download = 'dnd-combat-board-save.json';

      a.click();

      URL.revokeObjectURL(url);

      alert('Export successful!');

    } catch (err) {

      alert('Export failed: ' + err.message);

    }

  };

}


const importInventorybtn = document.getElementById("importInventory");
if (importInventorybtn) {
  importInventorybtn.onclick = () => {
  document.getElementById("importFile").click();
};
}

const importFile = document.getElementById("importFile");

if (importFile) {

  importFile.onchange = (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {

      try {

        const fileText = e.target.result;

        const data = JSON.parse(fileText);

        // Inventory
        if (data.inventory) {
          saveInventoryData(data.inventory);
        }

        // Item Definitions
        if (data.itemDefinitions) {
          saveItemDefinitions(data.itemDefinitions);
        }

        // Counters
        if (data.counters) {

          state.insightCounter = data.counters.insight || 0;
          state.xpCounter = data.counters.xp || 0;

          saveCounters();
        }

        // Waypoints
        if (data.waypoints) {

          state.waypoints = data.waypoints;

          saveWaypoints();
        }

        // Object Presets
        if (data.objectPresets) {

          saveObjectPresets(data.objectPresets);
        }

        // Board
        if (data.board) {

          state.tokens = data.board.tokens || [];
          state.objects = data.board.objects || [];

          state.initiative = data.board.initiative || [];

          state.currentTurn = data.board.currentTurn || 0;

          state.combatStarted = data.board.combatStarted || false;

          if (data.board.grid) {

            state.gridWidth =
              data.board.grid.width || state.gridWidth;

            state.gridHeight =
              data.board.grid.height || state.gridHeight;
          }
        }

        // Refresh UI
        syncInventoryUI();
        syncCharacterUI();

        loadWaypoints();

        render();

        alert("Import successful!");

      } catch (err) {

        alert("Import failed: " + err.message);

      }

    };

    reader.readAsText(file);

  };

}

function loadObjectPresets() {

  const stored = localStorage.getItem("objectPresets");

  return stored ? JSON.parse(stored) : [];

}

function saveObjectPresets(presets) {

  localStorage.setItem(
    "objectPresets",
    JSON.stringify(presets)
  );

}

/*document.getElementById("importFile").onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let content = e.target.result;
        if (content && content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        content = content.trim();

        const inventoryData = JSON.parse(content);
        saveInventoryData(inventoryData);
        populateCharacterDetailName();
        loadCharacterBoxes();
        loadAllCharactersInventory();
        if (document.getElementById("ask gpt").style.display === "block") {
          const selectName = document.getElementById("characterDetailName").textContent;
          if (selectName) loadCharacterInventory(selectName);
        }
        document.getElementById("importFile").value = "";
        alert('Inventory imported successfully!');
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
}; 
    ask for this
*/

// Inventory Management
function loadInventoryData() {
  const stored = localStorage.getItem("inventoryData");
  let data = stored ? JSON.parse(stored) : {};
  
  // Migrate old data: convert string arrays to object arrays
  Object.keys(data).forEach(charName => {
    const charData = data[charName];
    if (charData) {
      if (Array.isArray(charData.equipment) && charData.equipment.length > 0 && typeof charData.equipment[0] === 'string') {
        charData.equipment = charData.equipment.map(name => ({name, count: 1}));
      }
      if (Array.isArray(charData.inventory) && charData.inventory.length > 0 && typeof charData.inventory[0] === 'string') {
        charData.inventory = charData.inventory.map(name => ({name, count: 1}));
      }
    }
  });
  
  return data;
}

function saveInventoryData(data) {
  localStorage.setItem("inventoryData", JSON.stringify(data));
}

function syncInventoryUI() {
  /* populatecharacterDetailName(); // Refresh character name dropdown in character detail modal */
  populateCharactersList(); // Refresh character list in inventory modal
  loadCharacterBoxes(); // Refresh character boxes
  loadAllCharactersInventory?.(); // Refresh view all if it exists
};
  
function syncCharacterUI() {
  const select = document.getElementById("characterDetailName");
  const charName = select ? select.value : null;

  if (charName) {
    loadCharacterInventory(charName);
  }
}

function loadItemDefinitions() {
  const stored = localStorage.getItem("itemDefinitions");
  return stored ? JSON.parse(stored) : [];
}

function saveItemDefinitions(items) {
  localStorage.setItem("itemDefinitions", JSON.stringify(items));
}

// Waypoints Management
function loadWaypoints() {
  const stored = localStorage.getItem("waypoints");
  state.waypoints = stored ? JSON.parse(stored) : [];
  displayWaypoints();
}

function saveWaypoints() {
  localStorage.setItem("waypoints", JSON.stringify(state.waypoints));
}

function displayWaypoints() {
  const list = document.getElementById("waypointsList");
  list.innerHTML = "";
  
  state.waypoints.forEach((waypoint, index) => {
    const li = document.createElement("li");
    li.className = "waypoint-item";
    
    const nameSpan = document.createElement("span");
    nameSpan.className = "waypoint-name";
    nameSpan.textContent = waypoint.name;
    nameSpan.title = waypoint.description; // Hover tooltip
    
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeWaypoint(index);
    
    li.appendChild(nameSpan);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

function removeWaypoint(index) {
  state.waypoints.splice(index, 1);
  saveWaypoints();
  loadWaypoints();
}

//inport and export system
function exportAllData() {

  const saveData = {

    version: 1,
    exportedAt: Date.now(),

    inventory: loadInventoryData(),

    itemDefinitions: loadItemDefinitions(),

    waypoints: state.waypoints,

    counters: {
      insight: state.insightCounter,
      xp: state.xpCounter
    },

    objectPresets: loadObjectPresets(),

    board: {
      tokens: state.tokens,
      objects: state.objects,
      initiative: state.initiative,
      currentTurn: state.currentTurn,
      combatStarted: state.combatStarted,

      grid: {
        width: state.gridWidth,
        height: state.gridHeight
      }
    }
  };

  const blob = new Blob(
    [JSON.stringify(saveData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dnd-combat-save.json";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  alert("Export complete!");
}

function importAllData(data) {

  // Inventory
  localStorage.setItem(
    "inventoryData",
    JSON.stringify(data.inventory || {})
  );

  // Item definitions
  localStorage.setItem(
    "itemDefinitions",
    JSON.stringify(data.itemDefinitions || [])
  );

  // Waypoints
  state.waypoints = data.waypoints || [];
  saveWaypoints();

  // Counters
  state.insightCounter = data.counters?.insight || 0;
  state.xpCounter = data.counters?.xp || 0;
  saveCounters();

  // Object presets
  localStorage.setItem(
    "objectPresets",
    JSON.stringify(data.objectPresets || [])
  );

  // Board
  if (data.board) {

    state.tokens = data.board.tokens || [];

    state.objects = data.board.objects || [];

    state.initiative = data.board.initiative || [];

    state.currentTurn = data.board.currentTurn || 0;

    state.combatStarted = data.board.combatStarted || false;

    if (data.board.grid) {

      state.gridWidth = data.board.grid.width || 20;

      state.gridHeight = data.board.grid.height || 20;
    }
  }

  // Refresh UI
  syncInventoryUI();

  loadWaypoints();

  updateCounterDisplays();

  populatePresetDropdown();

  render();

  alert("Import complete!");
}

// Counter Management
function loadCounters() {
  const stored = localStorage.getItem("counters");
  if (stored) {
    const counters = JSON.parse(stored);
    state.insightCounter = counters.insight || 0;
    state.xpCounter = counters.xp || 0;
  }
  updateCounterDisplays();
}

function saveCounters() {
  const counters = {
    insight: state.insightCounter,
    xp: state.xpCounter
  };
  localStorage.setItem("counters", JSON.stringify(counters));
}

function updateCounterDisplays() {
  const insightInput = document.getElementById("insightCounter");
  const xpInput = document.getElementById("xpCounter");
  if (insightInput) insightInput.value = state.insightCounter;
  if (xpInput) xpInput.value = state.xpCounter;
}

function populateItemNameSuggestions() {
  const options = document.getElementById("itemNameOptions");
  const items = loadItemDefinitions();
  options.innerHTML = "";
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    options.appendChild(option);
  });
}

function getAllowedItem(name) {
  const items = loadItemDefinitions();
  return items.find(item => item.name.toLowerCase() === name.toLowerCase()) || null;
}

function populateItemManager() {
  const items = loadItemDefinitions();
  const list = document.getElementById("itemManagerList");
  list.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = item.name;
    nameSpan.title = item.description;
    nameSpan.style.cursor = "help";
    nameSpan.style.flex = "1";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      currentEditItemId = item.id;
      document.getElementById("itemNameInput").value = item.name;
      document.getElementById("itemDescriptionInput").value = item.description;
      document.getElementById("saveItem").textContent = "Save Item";
      document.getElementById("cancelItemEdit").style.display = "inline-block";
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => {
      if (!confirm(`Delete item "${item.name}"?`)) return;
      const updated = items.filter(def => def.id !== item.id);
      saveItemDefinitions(updated);
      populateItemManager();
      populateItemNameSuggestions();
      if (currentEditItemId === item.id) {
        currentEditItemId = null;
        document.getElementById("itemNameInput").value = "";
        document.getElementById("itemDescriptionInput").value = "";
        document.getElementById("saveItem").textContent = "Add Item";
        document.getElementById("cancelItemEdit").style.display = "none";
      }
    };

    li.appendChild(nameSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
  populateItemNameSuggestions();
}


 /* function populatecharacterDetailName() {
  const data = loadInventoryData();
  const select = document.getElementById("characterDetailName");
  select.textContent = ""; // Clear existing options
  
  const currentValue = select.value; // 🟢 save current selection

  // Clear existing options except the first
   while (select.options.length > 1) {
    select.remove(1);
  } 
  
  Object.keys(data).forEach(charName => {
    const option = document.createElement("option");
    option.value = charName;
    option.textContent = charName;
    select.appendChild(option);
  });

  // 🟢 restore current selection
  if (data[currentValue]) {
    select.value = currentValue;
  }  else if (select.options.length > 1) {
    select.value = select.options[1].value;
  } 
  
   if (select.options.length > 1) {
    select.value = select.options[1].value;
    loadCharacterInventory(select.value);
  } 
}


 /* document.getElementById("characterDetailName").addEventListener("change", (e) => {
  const charName = e.target.value;

  if (charName) {
    loadCharacterInventory(charName);
  } 
}); */

function loadAllCharactersInventory() {
  const data = loadInventoryData();
  const allChars = Object.keys(data);
  
  if (allChars.length === 0) {
    document.getElementById("allEquipmentList").innerHTML = "";
    document.getElementById("allInventoryList").innerHTML = "";
    document.getElementById("allGoldAmount").textContent = "0 gp total";
    return;
  }
  
  // Find common equipment names: names present in all characters
  const commonEquipmentNames = allChars.length > 0 ? data[allChars[0]].equipment.map(item => item.name).filter(name => allChars.every(char => data[char].equipment.some(item => item.name === name))) : [];
  
  // Find common inventory names
  const commonInventoryNames = allChars.length > 0 ? data[allChars[0]].inventory.map(item => item.name).filter(name => allChars.every(char => data[char].inventory.some(item => item.name === name))) : [];
  
  // Sum gold
  let totalGold = 0;
  allChars.forEach(charName => {
    const charData = data[charName];
    if (charData) {
      totalGold += charData.gold || 0;
    }
  });
  
  // Equipment
  const equipmentList = document.getElementById("allEquipmentList");
  equipmentList.innerHTML = "";
  commonEquipmentNames.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove from All";
    removeBtn.onclick = () => removeItemFromAll("equipment", name);
    li.appendChild(removeBtn);
    equipmentList.appendChild(li);
  });
  
  // Inventory
  const inventoryList = document.getElementById("allInventoryList");
  inventoryList.innerHTML = "";
  commonInventoryNames.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove from All";
    removeBtn.onclick = () => removeItemFromAll("inventory", name);
    li.appendChild(removeBtn);
    inventoryList.appendChild(li);
  });
  
  // Gold
  document.getElementById("allGoldAmount").textContent = totalGold + " gp total";
}

function loadCharacterInventory(charName) {
  const data = loadInventoryData();
  const charData = data[charName];
  if (!charData) return;
  
  // Ensure sections exist
  charData.equipment = charData.equipment || [];
  charData.inventory = charData.inventory || [];
  charData.gold = charData.gold || 0;
  
  // Equipment
  const equipmentList = document.getElementById("equipmentList");
  equipmentList.innerHTML = "";
  charData.equipment.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count})`;
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.onclick = () => adjustItemCount(charName, "equipment", index, -1);
    li.appendChild(minusBtn);
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = () => adjustItemCount(charName, "equipment", index, 1);
    li.appendChild(plusBtn);
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeItem(charName, "equipment", index);
    li.appendChild(removeBtn);
    equipmentList.appendChild(li);
  });
  
  // Inventory
  const inventoryList = document.getElementById("inventoryList");
  inventoryList.innerHTML = "";
  charData.inventory.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count})`;
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.onclick = () => adjustItemCount(charName, "inventory", index, -1);
    li.appendChild(minusBtn);
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = () => adjustItemCount(charName, "inventory", index, 1);
    li.appendChild(plusBtn);
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeItem(charName, "inventory", index);
    li.appendChild(removeBtn);
    inventoryList.appendChild(li);
  });
  
  // Gold
  document.getElementById("goldAmount").textContent = charData.gold + " gp";
}

function adjustItemCount(charName, section, index, delta) {
  const data = loadInventoryData();
  if (data[charName] && data[charName][section]) {
    const item = data[charName][section][index];
    item.count += delta;
    if (item.count <= 0) {
      data[charName][section].splice(index, 1);
    }
    saveInventoryData(data);
    syncInventoryUI(charName);
  }
}

function loadCharacterBoxes() {
  const data = loadInventoryData();
  const container = document.getElementById("characterBoxesContainer");
  container.innerHTML = "";

  Object.keys(data).forEach(charName => {
    const charData = data[charName];
    const box = document.createElement("div");
    box.className = "character-box";
    
    const nameDiv = document.createElement("div");
    nameDiv.className = "character-box-name";
    nameDiv.textContent = charName;
    box.appendChild(nameDiv);

    const equipSection = document.createElement("div");
    equipSection.className = "character-box-section";
    const equipTitle = document.createElement("h5");
    equipTitle.textContent = "Equipment";
    equipSection.appendChild(equipTitle);
    const equipList = document.createElement("ul");
    (charData.equipment || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} (${item.count})`;
      equipList.appendChild(li);
    });
    equipSection.appendChild(equipList);
    box.appendChild(equipSection);

    const invSection = document.createElement("div");
    invSection.className = "character-box-section";
    const invTitle = document.createElement("h5");
    invTitle.textContent = "Inventory";
    invSection.appendChild(invTitle);
    const invList = document.createElement("ul");
    (charData.inventory || []).forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} (${item.count})`;
      invList.appendChild(li);
    });
    invSection.appendChild(invList);
    box.appendChild(invSection);

    const goldSection = document.createElement("div");
    goldSection.className = "character-box-section";
    const goldTitle = document.createElement("h5");
    goldTitle.textContent = "Gold";
    goldSection.appendChild(goldTitle);
    const goldText = document.createElement("div");
    goldText.textContent = `${charData.gold || 0} gp`;
    goldSection.appendChild(goldText);
    box.appendChild(goldSection);

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "View";
    viewBtn.onclick = () => {
      // alert(`View button clicked for ${charName}`); // Uncomment for debugging
      openCharacterDetail(charName);
    };
    box.appendChild(viewBtn);

    container.appendChild(box);
  });
}

function populateCharactersList() {
  const data = loadInventoryData();
  const listContainer = document.getElementById("charactersList");
  listContainer.innerHTML = "";

  Object.keys(data).forEach(charName => {
    const item = document.createElement("div");
    item.className = "character-list-item";
    
    const nameSpan = document.createElement("span");
    nameSpan.textContent = charName;
    item.appendChild(nameSpan);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => {
      if (!confirm(`Remove character "${charName}"?`)) return;
      const newData = loadInventoryData();
      delete newData[charName];
      saveInventoryData(newData);
      populateCharactersList();
      loadCharacterBoxes(); // Refresh character boxes
    };
    item.appendChild(removeBtn);
    listContainer.appendChild(item);
  });
}

function openCharacterDetail(charName) {
  // alert(`Opening detail modal for ${charName}`); // Uncomment for debugging
  const data = loadInventoryData();
  const charData = data[charName];
  if (!charData) return;

  document.getElementById("characterDetailName").textContent = charName;
  document.getElementById("detailGoldAmount").textContent = (charData.gold || 0) + " gp";
  
  populateDetailLists(charName);
  
  document.getElementById("characterDetailModal").style.display = "block";
  document.getElementById("inventoryModal").style.display = "none";
}

function populateDetailLists(charName) {
  const data = loadInventoryData();
  const charData = data[charName];
  
  // Equipment
  const equipList = document.getElementById("detailEquipmentList");
  equipList.innerHTML = "";
  (charData.equipment || []).forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count})`;
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.onclick = () => adjustCharDetailCount(charName, "equipment", index, -1);
    li.appendChild(minusBtn);
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = () => adjustCharDetailCount(charName, "equipment", index, 1);
    li.appendChild(plusBtn);
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeCharDetailItem(charName, "equipment", index);
    li.appendChild(removeBtn);
    equipList.appendChild(li);
  });

  // Inventory
  const invList = document.getElementById("detailInventoryList");
  invList.innerHTML = "";
  (charData.inventory || []).forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.count})`;
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.onclick = () => adjustCharDetailCount(charName, "inventory", index, -1);
    li.appendChild(minusBtn);
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = () => adjustCharDetailCount(charName, "inventory", index, 1);
    li.appendChild(plusBtn);
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeCharDetailItem(charName, "inventory", index);
    li.appendChild(removeBtn);
    invList.appendChild(li);
  });
}

function adjustCharDetailCount(charName, section, index, delta) {
  const data = loadInventoryData();
  if (data[charName] && data[charName][section]) {
    const item = data[charName][section][index];
    const oldCount = item.count;
    item.count += delta;
    if (item.count <= 0) {
      data[charName][section].splice(index, 1);
      // alert(`${item.name} removed from ${charName}'s ${section}.`); // Uncomment for feedback
    } else {
      // alert(`${item.name} count ${delta > 0 ? 'increased' : 'decreased'} to ${item.count} in ${charName}'s ${section}.`); // Uncomment for feedback
    }
    saveInventoryData(data);
    populateDetailLists(charName);
    syncInventoryUI(charName); // optional but safe
  }
}

function removeCharDetailItem(charName, section, index) {
  const data = loadInventoryData();
  if (data[charName] && data[charName][section]) {
    const itemName = data[charName][section][index].name;
    data[charName][section].splice(index, 1);
    saveInventoryData(data);
    populateDetailLists(charName);
    syncInventoryUI(charName);
    alert(`${itemName} removed from ${charName}'s ${section}.`);
  }
}

function isAllowedItem(itemName) {
  const items = loadItemDefinitions();
  return items.some(item => item.name.toLowerCase() === itemName.toLowerCase());
}

function setupInventoryModalHandlers() {
  // Character Detail Modal Handlers
  const detailAddEquipmentBtn = document.getElementById("detailAddEquipment");
  if (detailAddEquipmentBtn) {
    detailAddEquipmentBtn.addEventListener("click", () => {
      const charName = document.getElementById("characterDetailName").textContent;
      const item = document.getElementById("detailEquipmentInput").value.trim();
      if (!item) return;
      
      if (!isAllowedItem(item)) {
        return alert("No such item in the items list. Add it there.");
      }
      
      const data = loadInventoryData();
      if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
      const existing = data[charName].equipment.find(eq => eq.name.toLowerCase() === item.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        data[charName].equipment.push({name: item, count: 1});
      }
      document.getElementById("detailEquipmentInput").value = "";
      saveInventoryData(data);
      syncInventoryUI(charName);
      populateDetailLists(charName);
      syncCharacterUI();
      // alert(`Equipment ${item} added to ${charName}.`); // Uncomment for feedback
    });
  }

  const detailAddInventoryBtn = document.getElementById("detailAddInventory");
  if (detailAddInventoryBtn) {
    detailAddInventoryBtn.addEventListener("click", () => {
      const charName = document.getElementById("characterDetailName").textContent;
      const item = document.getElementById("detailInventoryInput").value.trim();
      if (!item) return;
      
      if (!isAllowedItem(item)) {
        return alert("No such item in the items list. Add it there.");
      }
      
      const data = loadInventoryData();
      if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
      const existing = data[charName].inventory.find(inv => inv.name.toLowerCase() === item.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        data[charName].inventory.push({name: item, count: 1});
      }
      document.getElementById("detailInventoryInput").value = "";
      saveInventoryData(data);
      populateDetailLists(charName);
      syncInventoryUI(charName);
      syncCharacterUI();
      // alert(`Item ${item} added to ${charName}.`); // Uncomment for feedback
    });
  }

  const detailAddGoldBtn = document.getElementById("detailAddGold");
  if (detailAddGoldBtn) {
    detailAddGoldBtn.addEventListener("click", () => {
      const charName = document.getElementById("characterDetailName").textContent;
      const amount = parseInt(document.getElementById("detailGoldInput").value) || 0;
      if (!amount) return;
      
      const data = loadInventoryData();
      if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
      data[charName].gold += amount;
      document.getElementById("detailGoldInput").value = "";
      document.getElementById("detailGoldAmount").textContent = data[charName].gold + " gp";
      saveInventoryData(data);
      populateDetailLists(charName);
      syncInventoryUI(charName);
      syncCharacterUI();
      // alert(`Gold ${amount} gp added to ${charName}.`); // Uncomment for feedback
    });
  }

  const detailSubtractGoldBtn = document.getElementById("detailSubtractGold");
  if (detailSubtractGoldBtn) {
    detailSubtractGoldBtn.addEventListener("click", () => {
      const charName = document.getElementById("characterDetailName").textContent;
      const amount = parseInt(document.getElementById("detailGoldInput").value) || 0;
      if (!amount) return;
      
      const data = loadInventoryData();
      if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
      data[charName].gold = Math.max(0, data[charName].gold - amount);
      document.getElementById("detailGoldInput").value = "";
      document.getElementById("detailGoldAmount").textContent = data[charName].gold + " gp";
      saveInventoryData(data);
      populateDetailLists(charName);
      syncInventoryUI(charName);
      syncCharacterUI();
      // alert(`Gold ${amount} gp subtracted from ${charName}.`); // Uncomment for feedback
    });
  }

  // All Characters Modal Handlers
  const addAllEquipmentBtn = document.getElementById("addAllEquipment");
  if (addAllEquipmentBtn) {
    addAllEquipmentBtn.addEventListener("click", () => {
      const item = document.getElementById("allEquipmentInput").value.trim();
      if (!item) return;
      
      const data = loadInventoryData();
      if (!isAllowedItem(item)) {
        return alert("That item is not allowed. Add it first on the Items page.");
      }
      Object.keys(data).forEach(name => {
        if (!data[name]) data[name] = { equipment: [], inventory: [], gold: 0 };
        const existing = data[name].equipment.find(eq => eq.name.toLowerCase() === item.toLowerCase());
        if (existing) {
          existing.count += 1;
        } else {
          data[name].equipment.push({name: item, count: 1});
        }
      });
      document.getElementById("allEquipmentInput").value = "";
      saveInventoryData(data);
      syncInventoryUI();
      syncCharacterUI();
      alert(`Equipment ${item} added to all characters.`);
    });
  }

  const addAllInventoryBtn = document.getElementById("addAllInventory");
  if (addAllInventoryBtn) {
    addAllInventoryBtn.addEventListener("click", () => {
      const item = document.getElementById("allInventoryInput").value.trim();
      if (!item) return;
      
      const data = loadInventoryData();
      if (!isAllowedItem(item)) {
        return alert("That item is not allowed. Add it first on the Items page.");
      }
      Object.keys(data).forEach(name => {
        if (!data[name]) data[name] = { equipment: [], inventory: [], gold: 0 };
        const existing = data[name].inventory.find(inv => inv.name.toLowerCase() === item.toLowerCase());
        if (existing) {
          existing.count += 1;
        } else {
          data[name].inventory.push({name: item, count: 1});
        }
      });
      document.getElementById("allInventoryInput").value = "";
      saveInventoryData(data);
      syncInventoryUI();
      syncCharacterUI();
      alert(`Item ${item} added to all characters.`);
    });
  }

  const addAllGoldBtn = document.getElementById("addAllGold");
  if (addAllGoldBtn) {
    addAllGoldBtn.addEventListener("click", () => {
      const amount = parseInt(document.getElementById("allGoldInput").value) || 0;
      if (!amount) return;
      
      const data = loadInventoryData();
      Object.keys(data).forEach(name => {
        if (!data[name]) data[name] = { equipment: [], inventory: [], gold: 0 };
        data[name].gold += amount;
      });
      document.getElementById("allGoldInput").value = "";
      saveInventoryData(data);
      syncInventoryUI();
      syncCharacterUI();
      alert(`Gold ${amount} gp added to all characters.`);
    });
  }

  const subtractAllGoldBtn = document.getElementById("subtractAllGold");
  if (subtractAllGoldBtn) {
    subtractAllGoldBtn.addEventListener("click", () => {
      const amount = parseInt(document.getElementById("allGoldInput").value) || 0;
      if (!amount) return;
      
      const data = loadInventoryData();
      Object.keys(data).forEach(name => {
        if (!data[name]) data[name] = { equipment: [], inventory: [], gold: 0 };
        data[name].gold = Math.max(0, data[name].gold - amount);
      });
      document.getElementById("allGoldInput").value = "";
      saveInventoryData(data);
      syncInventoryUI();
      syncCharacterUI();
      alert(`Gold ${amount} gp subtracted from all characters.`);
    });
  }
}

function removeItem(charName, section, index) {
  const data = loadInventoryData();
  if (data[charName] && data[charName][section]) {
    data[charName][section].splice(index, 1);
    saveInventoryData(data);
    syncInventoryUI(charName);
  }
}

function removeItemFromAll(section, itemName) {
  const data = loadInventoryData();
  let hasItem = [];
  let missingItem = [];
  
  Object.keys(data).forEach(charName => {
    const charData = data[charName];
    if (charData[section].some(item => item.name === itemName)) {
      hasItem.push(charName);
    } else {
      missingItem.push(charName);
    }
  });
  
  if (missingItem.length > 0) {
    alert(`Cannot remove "${itemName}" - not found in: ${missingItem.join(", ")}`);
    return;
  }
  
  // Remove one instance from each character that has it
  hasItem.forEach(charName => {
    const charData = data[charName];
    const itemIndex = charData[section].findIndex(item => item.name === itemName);
    if (itemIndex > -1) {
      const item = charData[section][itemIndex];
      item.count -= 1;
      if (item.count <= 0) {
        charData[section].splice(itemIndex, 1);
      }
    }
  });
  
  saveInventoryData(data);
  syncInventoryUI();
  syncCharacterUI();
  alert(`Removed one "${itemName}" from all characters.`);
}


   const addCharacterBtn = document.getElementById("addCharacterBtn");
  if (addCharacterBtn) {
    addCharacterBtn.onclick = () => {
      const charName = prompt("Enter character name:");
      if (!charName) return;

  const data = loadInventoryData();
  if (data[charName]) {
    alert("Character already exists!");
    return;
  }
  
  data[charName] = { equipment: [], inventory: [], gold: 0 };
  saveInventoryData(data);
  syncInventoryUI();
  syncCharacterUI();
  document.getElementById("characterDetailName").textContent = charName;
};
}


   const addEquipmentBtn = document.getElementById("addEquipment");
  if (addEquipmentBtn) {
    addEquipmentBtn.onclick = () => {
  const charName = document.getElementById("characterDetailName").textContent;
  const item = document.getElementById("equipmentInput").value.trim();
  if (!item) return;
  
  const data = loadInventoryData();
  if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
  if (!isAllowedItem(item)) {
    return alert("That item is not allowed. Add it first on the Items page.");
  }
  const existing = data[charName].equipment.find(eq => eq.name.toLowerCase() === item.toLowerCase());
  if (existing) {
    existing.count += 1;
  } else {
    data[charName].equipment.push({name: item, count: 1});
  }
  saveInventoryData(data);
  document.getElementById("equipmentInput").value = "";
  syncInventoryUI(charName);
  syncCharacterUI();
  };
}


   const addInventoryBtn = document.getElementById("addInventory");
  if (addInventoryBtn) {
    addInventoryBtn.onclick = () => {
  const charName = document.getElementById("characterDetailName").textContent;
  const item = document.getElementById("inventoryInput").value.trim();
  if (!item) return;
  
  const data = loadInventoryData();
  if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
  if (!isAllowedItem(item)) {
    return alert("That item is not allowed. Add it first on the Items page.");
  }
  const existing = data[charName].inventory.find(inv => inv.name.toLowerCase() === item.toLowerCase());
  if (existing) {
    existing.count += 1;
  } else {
    data[charName].inventory.push({name: item, count: 1});
  }
  saveInventoryData(data);
  document.getElementById("inventoryInput").value = "";
  syncInventoryUI(charName);
  syncCharacterUI();
};
}


   const addGoldBtn = document.getElementById("addGold");
  if (addGoldBtn) {
    addGoldBtn.onclick = () => {
  const charName = document.getElementById("characterDetailName").textContent;
  const amount = parseInt(document.getElementById("goldInput").value) || 0;
  
  const data = loadInventoryData();
  if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
  data[charName].gold += amount;
  saveInventoryData(data);
  document.getElementById("goldInput").value = "";
  syncInventoryUI(charName);
  syncCharacterUI();
};
}


   const subtractGoldBtn = document.getElementById("subtractGold");
  if (subtractGoldBtn) {
    subtractGoldBtn.onclick = () => {
  const charName = document.getElementById("characterDetailName").textContent;
  const amount = parseInt(document.getElementById("goldInput").value) || 0;
  
  const data = loadInventoryData();
  if (!data[charName]) data[charName] = { equipment: [], inventory: [], gold: 0 };
  data[charName].gold = Math.max(0, data[charName].gold - amount);
  saveInventoryData(data);
  document.getElementById("goldInput").value = "";
  syncInventoryUI(charName);
  syncCharacterUI();
};
}


   const createObjectBtn = document.getElementById("createObject");
  if (createObjectBtn) {
    createObjectBtn.onclick = () => {
  const name = document.getElementById("objectName").value.trim();
  const color = document.getElementById("objectColor").value;
  const size = document.getElementById("objectSize").value;
  const form = document.getElementById("objectForm").value;

  if (!name) { return alert("Please enter a name for the object."); }
  if (!color) { return alert("Please select a color for the object."); }

  const object = {
    id: crypto.randomUUID(),
    name,
    color,
    size,
    form,
    x: 5,
    y: 5
  };

  state.objects.push(object);
  document.getElementById("objectModal").style.display = "none";
  render();
};
}



const cancelObjectBtn = document.getElementById("cancelObject");
if (cancelObjectBtn) {
  cancelObjectBtn.onclick = () => { document.getElementById("objectModal").style.display = "none";
  };
}

function closeAllModals() {
  [
    "inventoryModal",
    "charactersModal",
    "characterDetailModal",
    "viewAllModal",
    "itemManagerModal",
    "objectModal",
    "tutorialModal",
    "waypointsModal"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function drawTutorialIcon() {
  const canvas = document.getElementById("tutorialCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#444";
  ctx.fillRect(size * 0.4, size * 0.25, size * 0.2, size * 0.4);
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.75, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
};

// Token Duplication
function copyToken(token) {

  const newName = prompt(
    "Enter name for copied token:",
    token.name + " Copy"
  );

  if (newName === null) return;

  const copiedToken = {

    ...token,

    id: crypto.randomUUID(),

    name: newName.trim() || (token.name + " Copy"),

    x: token.x,
    y: token.y
  };

  state.tokens.push(copiedToken);

  render();
}

// Object Duplication
function copyObject(object) {

  const copiedObject = {

    ...object,

    id: crypto.randomUUID(),

    name: object.name + " Copy",

    x: object.x,
    y: object.y
  };

  state.objects.push(copiedObject);

  render();
}

// Bring token to front when selected
function bringTokenToFront(token) {
  state.tokens = state.tokens.filter(t => t.id !== token.id);
  state.tokens.push(token);
}

// Bring object to front when selected
function bringObjectToFront(object) {
  state.objects = state.objects.filter(o => o.id !== object.id);
  state.objects.push(object);
}

// Initialize item definitions if none exist
if (!localStorage.getItem("itemDefinitions")) {
  const defaultItems = [
    { id: crypto.randomUUID(), name: "Sword", description: "A sharp blade for melee combat" },
    { id: crypto.randomUUID(), name: "Shield", description: "Protective gear for defense" },
    { id: crypto.randomUUID(), name: "Potion of Healing", description: "Restores hit points when consumed" },
    { id: crypto.randomUUID(), name: "Rope", description: "Useful for climbing and binding" },
    { id: crypto.randomUUID(), name: "Torch", description: "Provides light in dark areas" }
  ];
  saveItemDefinitions(defaultItems);
}

// Load waypoints on startup
loadWaypoints();

// Load counters on startup
loadCounters();

populatePresetDropdown();

drawTutorialIcon();

render();

// Initialize grid inputs and button states
const dims = calculateGridDimensions();
applyGridDimensions();
gridLengthInput.value = dims.lengthFt;
gridHeightInput.value = dims.heightFt;
updateGridButtonStates();

});