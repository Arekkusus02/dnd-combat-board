const board = document.getElementById("board");
const canvas = board;
const ctx = canvas.getContext("2d");

const tokenName = document.getElementById("tokenName");
const tokenColor = document.getElementById("tokenColor");
const tokenBonus = document.getElementById("tokenBonus");
const dice = document.getElementById("dice");
const nextTurn = document.getElementById("nextTurn");
const resetMove = document.getElementById("resetMove");
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
  settledDiceRoll: null
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

function createToken(name, color, bonus = 0) {
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
    turnStartY : 5
  };
}

document.getElementById("addToken").onclick = () => {
  const name = tokenName.value.trim();
  const color = tokenColor.value;
  const bonus = parseInt(tokenBonus.value, 10) || 0;

  if (!name) { return alert("Please enter a name for the token."); }
  if (!color) { return alert("Please select a color for the token."); }
  if (isNaN(bonus)) { return alert("Please enter a valid bonus for the token."); }

  const token = createToken(name, color, bonus);
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
    const token = state.tokens.find(t => t.id === entry.id);

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

  state.combatStarted = false;
  state.currentTurn = 0;
  state.movement.used = 0;
  state.movement.activeTokenId = null;
  state.initiative = [];
  state.settledDiceRoll = null;
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

  const token = state.tokens.find(t => t.x === x && t.y === y);

  if (token) {
    state.selected = token;
    state.movement.activeTokenId = token.id;
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.selected) return;

  const x = Math.floor(e.offsetX / state.grid);
  const y = Math.floor(e.offsetY / state.grid);

  state.selected.x = x;
  state.selected.y = y;

  const dx = x - state.selected.turnStartX;
  const dy = y - state.selected.turnStartY;

  state.movement.used = (Math.abs(dx) + Math.abs(dy)) * 5;

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

  ctx.beginPath();
  ctx.moveTo(cx, cy);

  ctx.arc(
    cx,
    cy,
    150,
    token.direction - Math.PI / 3,
    token.direction + Math.PI / 3
  );

  ctx.fillStyle = "rgba(0,255,0,0.2)";
  ctx.fill();
}

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  const token = state.tokens.find(t => t.x === gridX && t.y === gridY);

  if (!token) return;

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
});

canvas.addEventListener("dblclick", (e) => {
  const gridX = Math.floor(e.offsetX / state.grid);
  const gridY = Math.floor(e.offsetY / state.grid);

  const token = state.tokens.find(t => t.x === gridX && t.y === gridY);

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

function drawTokens() {
  state.tokens.forEach(t => {
    const size = state.grid;

     const cx = t.x * size + size / 2;
     const cy = t.y * size + size / 2;

    // token
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(cx, cy, size/3, 0, Math.PI * 2);
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
  const activeText = activeToken ? `Active: ${activeToken.name}` : "No active token";

  tooltip.innerText = `${turnText} | ${activeText} | Moved: ${state.movement.used} ft`;
}

function render() {
  applyGridDimensions();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawTokens();
  renderInitiative();
  renderTokensPanel();
  updateTooltip();
  updateGridButtonStates();

  movementInfo.innerText = state.movement.used + " ft";
}

render();

// Initialize grid inputs and button states
const dims = calculateGridDimensions();
applyGridDimensions();
gridLengthInput.value = dims.lengthFt;
gridHeightInput.value = dims.heightFt;
updateGridButtonStates();