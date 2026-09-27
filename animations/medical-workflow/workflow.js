/* Standalone, dependency-free conceptual animation. No imaging data required. */
"use strict";
if (new URLSearchParams(window.location.search).get("embed") === "1") {
  document.documentElement.classList.add("embedded");
}
const stages = [
  ["MRI", "Acquire a volume of image slices as the starting point for the model.", "IMAGE VOLUME"],
  ["Image processing / segmentation", "Process the slices and label the structures of interest.", "SEGMENTATION MASK"],
  ["Anatomical regions", "Organize the segmented structures into distinct anatomical regions.", "REGION GEOMETRY"],
  ["Computational mesh", "Discretize the geometry into connected elements and nodes.", "ELEMENTS + NODES"],
  ["Material model", "Assign constitutive relationships and properties to the regions.", "MATERIAL PROPERTIES"],
  ["FEM (finite element method)", "Assemble element contributions with loads and boundary conditions.", "DISCRETE EQUATIONS"],
  ["Numerical solver", "Iterate toward a solution of the assembled equations.", "SOLUTION FIELDS"],
  ["Biomechanical simulation", "Explore the model’s response to the applied loading.", "MODEL RESPONSE"],
  ["Visualization / analysis", "Inspect the resulting fields and compare quantities of interest.", "VISUAL INSIGHT"],
];
const $ = id => document.getElementById(id);
const ns = "http://www.w3.org/2000/svg";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 700px)");
const duration = 3.2;
let time = 0, previous = null, running = !reducedMotion.matches, speed = 1, active = -1;
let frame = null;
const cards = stages.map(([title], i) => {
  const li = document.createElement("li");
  li.className = "stage";
  const button = document.createElement("button");
  button.className = "stage-button";
  button.type = "button";
  button.setAttribute("aria-label", `Inspect stage ${i + 1}: ${title}`);
  button.innerHTML = `<span class="stage-heading"><span class="stage-number">${String(i + 1).padStart(2, "0")}</span><span class="stage-state">Queued</span></span><span class="stage-title"></span><canvas width="500" height="188" aria-hidden="true"></canvas>`;
  button.querySelector(".stage-title").textContent = title;
  li.append(button);
  $("stages").append(li);
  button.addEventListener("click", () => {
    time = i * duration;
    running = false;
    playback();
    render();
  });
  return { li, button, canvas: button.querySelector("canvas"), state: button.querySelector(".stage-state") };
});
const links = Array.from({ length: 8 }, () => {
  const path = document.createElementNS(ns, "path");
  path.setAttribute("class", "connector");
  const packet = document.createElementNS(ns, "circle");
  packet.setAttribute("class", "packet");
  packet.setAttribute("r", "3.5");
  $("paths").append(path, packet);
  return { path, packet, length: 0 };
});

function layout() {
  cards.forEach(({ li }, i) => {
    const row = Math.floor(i / 3);
    li.style.gridRow = mobile.matches ? "auto" : row + 1;
    li.style.gridColumn = mobile.matches ? "auto" : (row % 2 ? 3 - i % 3 : i % 3 + 1);
  });
  const origin = $("flow").getBoundingClientRect();
  links.forEach((link, i) => {
    const a = cards[i].li.getBoundingClientRect();
    const b = cards[i + 1].li.getBoundingClientRect();
    let x1, y1, x2, y2;
    if (Math.abs(a.top - b.top) < 2) {
      const right = b.left > a.left;
      x1 = (right ? a.right : a.left) - origin.left;
      x2 = (right ? b.left : b.right) - origin.left;
      y1 = y2 = a.top + a.height / 2 - origin.top;
    } else {
      x1 = a.left + a.width / 2 - origin.left;
      x2 = b.left + b.width / 2 - origin.left;
      y1 = a.bottom - origin.top;
      y2 = b.top - origin.top;
    }
    link.path.setAttribute("d", `M${x1},${y1} L${x2},${y2}`);
    link.length = link.path.getTotalLength();
  });
  render();
}

function playback() {
  $("play").textContent = running ? "Pause" : "Play";
  $("playback-label").textContent = running ? "Workflow in motion" : "Workflow paused";
  if (!running && frame !== null) { cancelAnimationFrame(frame); frame = null; }
  previous = null;
  if (running && !document.hidden && frame === null) frame = requestAnimationFrame(tick);
}
$("play").addEventListener("click", () => { running = !running; playback(); });
$("restart").addEventListener("click", () => { time = 0; render(); playback(); });
$("speed").addEventListener("change", event => { speed = Number(event.target.value); });
document.addEventListener("visibilitychange", () => {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  playback();
});
reducedMotion.addEventListener("change", event => { if (event.matches) { running = false; playback(); } });
new ResizeObserver(layout).observe($("flow"));
mobile.addEventListener("change", layout);

function line(c, points, color = "#1e3a8a", width = 1.5) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function ellipse(c, x, y, rx, ry, fill, stroke = "#1e3a8a") {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill(); c.strokeStyle = stroke; c.lineWidth = 1.2; c.stroke();
}
function text(c, label, x, y, size = 10, color = "#525252") {
  c.fillStyle = color; c.font = `${size}px ui-monospace, monospace`; c.fillText(label, x, y);
}
function mesh(c, phase, deform = false, filled = false) {
  const nodes = [];
  for (let row = 0; row < 5; row++) {
    nodes[row] = [];
    for (let col = 0; col < 8; col++) {
      const x = 38 + col * 24;
      const y = 17 + row * 15 + (deform ? Math.sin(col / 7 * Math.PI) * Math.sin(phase * Math.PI * 2) * 9 : Math.sin(col * 1.3 + row) * 2);
      nodes[row].push([x, y]);
    }
  }
  for (let r = 0; r < 4; r++) for (let j = 0; j < 7; j++) {
    const a = nodes[r][j], b = nodes[r][j + 1], d = nodes[r + 1][j], e = nodes[r + 1][j + 1];
    if (filled) {
      c.fillStyle = `rgba(30,58,138,${.08 + .65 * (j / 7) * (.6 + .4 * Math.sin(phase * 6 + r))})`;
      c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...e); c.lineTo(...d); c.closePath(); c.fill();
    }
    line(c, [a,b,e,d,a,e], "#6078a6", .7);
  }
  nodes.flat().forEach(([x,y]) => { c.fillStyle = "#1e3a8a"; c.fillRect(x-1,y-1,2,2); });
}
function draw(index, phase, selected) {
  const canvas = cards[index].canvas;
  const c = canvas.getContext("2d");
  c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 250, 94);
  c.globalAlpha = selected ? 1 : .65;
  const wave = Math.sin(phase * Math.PI * 2);
  if (index === 0) {
    for (let j = 3; j >= 0; j--) {
      c.fillStyle = "#f0f0f0"; c.strokeStyle = "#b8b8b8";
      c.fillRect(65+j*8, 8+j*3, 100, 74); c.strokeRect(65+j*8, 8+j*3, 100, 74);
    }
    ellipse(c, 115, 45, 32, 31, "#d4d4d4", "#737373");
    ellipse(c, 103, 45, 11, 22, "#a3a3a3", "#a3a3a3");
    ellipse(c, 127, 45, 11, 22, "#b8b8b8", "#a3a3a3");
    line(c, [[61, 12+phase*67],[170,12+phase*67]], "#1e3a8a", 2);
    text(c, "SLICE", 7, 46, 8); text(c, String(Math.floor(phase*128)).padStart(3,"0"), 8, 60);
  } else if (index === 1 || index === 2) {
    const shift = index === 2 ? 8 + 7*wave : 0;
    ellipse(c, 120, 46, 47, 36, "#f0f0f0", "#b0b0b0");
    ellipse(c, 101-shift, 44, 17, 26, "#c4cee2");
    ellipse(c, 139+shift, 44, 17, 26, "#7d94be");
    ellipse(c, 120, 64+shift*.5, 13, 10, "#1e3a8a");
    if (index === 1) {
      const x = 70+100*phase;
      c.fillStyle = "#1e3a8a10"; c.fillRect(70, 6, x-70, 78);
      line(c, [[x,6],[x,84]], "#1e3a8a", 1.5);
    } else {
      line(c, [[149+shift,30],[185,20],[211,20]], "#879bc3", 1);
      text(c, "R02", 214, 23, 8); text(c, "R01", 27, 34, 8);
      line(c, [[53,31],[74-shift,34]], "#879bc3", 1);
    }
  } else if (index === 3) {
    mesh(c, phase);
    c.fillStyle = "#1e3a8a15"; c.fillRect(36+phase*170, 12, 14, 70);
  } else if (index === 4) {
    for (let j=0;j<3;j++) {
      c.fillStyle = ["#d4d4d4", "#879bc3", "#1e3a8a"][j]; c.fillRect(30,15+j*22,23,14);
      line(c, [[61,22+j*22],[102,22+j*22]], "#b0b0b0", 1);
      const x = 77+9*Math.sin(phase*6+j);
      ellipse(c,x,22+j*22,3,3,"#1e3a8a");
    }
    line(c, [[136,12],[136,79],[231,79]], "#a3a3a3", 1);
    line(c, Array.from({length:31},(_,j)=>[140+j*2.7,75-(j/30)**2*53]), "#1e3a8a", 2);
    const x = phase*30; ellipse(c,140+x*2.7,75-(x/30)**2*53,3,3,"#1e3a8a");
    text(c,"strain",185,91,8); text(c,"stress",139,12,8);
  } else if (index === 5) {
    for(let r=0;r<5;r++) for(let j=0;j<5;j++) {
      c.fillStyle = r===j ? "#1e3a8a" : Math.abs(r-j)===1 ? "#879bc3" : "#ededed";
      if (Math.floor(phase*5)===r) c.fillStyle = "#425e96";
      c.fillRect(36+j*12,14+r*12,9,9);
    }
    text(c,"×",106,48,18); text(c,"=",159,48,18);
    for(let r=0;r<5;r++) {
      c.fillStyle = "#c4cee2"; c.fillRect(132,14+r*12,10,9);
      c.fillStyle = "#1e3a8a"; c.fillRect(185,14+r*12,10,9);
    }
    text(c,"K",58,87); text(c,"u",133,87); text(c,"f",187,87);
  } else if (index === 6) {
    line(c, [[33,10],[33,77],[220,77]], "#a3a3a3", 1);
    for(let j=0;j<3;j++) line(c,[[33,22+j*18],[220,22+j*18]],"#ededed",1);
    const points = Array.from({length:Math.floor(phase*60)+2},(_,j)=>[37+j*2.9,17+53*(1-Math.exp(-j/13))+Math.sin(j*1.8)*3*Math.exp(-j/15)]);
    line(c,points,"#1e3a8a",2); ellipse(c,...points.at(-1),3,3,"#1e3a8a");
    text(c,"residual",36,9,8); text(c,"iteration",164,90,8);
  } else if (index === 7) {
    mesh(c,phase,true,true);
    line(c,[[28,14],[28,80]],"#525252",2);
    for(let j=0;j<6;j++) line(c,[[22,17+j*11],[28,12+j*11]],"#737373",1);
    line(c,[[217,46],[239,46],[233,41],[239,46],[233,51]],"#1e3a8a",1.5);
  } else {
    c.save(); c.translate(-15,0); c.scale(.8,.85); mesh(c,phase,true,true); c.restore();
    line(c,[[171,16],[171,74],[238,74]],"#a3a3a3",1);
    line(c,Array.from({length:33},(_,j)=>[175+j*1.8,49-20*Math.sin(j*.17+phase*6)]),"#1e3a8a",1.5);
    for(let j=0;j<80;j++) { c.fillStyle=`rgba(30,58,138,${.1+j/90})`;c.fillRect(18+j*1.5,78,1.5,5); }
    text(c,"low",18,92,8);text(c,"high",116,92,8);
  }
  c.globalAlpha = 1;
}
function render() {
  const position = time / duration;
  const index = Math.min(8, Math.floor(position));
  const phase = position % 1;
  if (active !== index) {
    active = index;
    cards.forEach(({ button, state }, i) => {
      if(i===index) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
      state.textContent = i===index ? "Processing" : i<index ? "Complete" : "Queued";
    });
    $("step-number").textContent = `${String(index+1).padStart(2,"0")} / 09`;
    $("detail-title").textContent = stages[index][0];
    $("detail-text").textContent = stages[index][1];
    $("output").textContent = `OUTPUT / ${stages[index][2]}`;
  }
  cards.forEach((_,i)=>draw(i,i===index?phase:i<index?.95:0,i===index));
  links.forEach(({path,packet,length},i)=>{
    packet.style.display = i===index && phase>.65 ? "" : "none";
    if (length && i===index) {
      const point=path.getPointAtLength(Math.max(0,(phase-.65)/.35)*length);
      packet.setAttribute("cx",point.x);packet.setAttribute("cy",point.y);
    }
  });
  $("progress").style.width = `${position/9*100}%`;
}
function tick(now) {
  frame = null;
  if (!running || document.hidden) return;
  if (previous!==null) time=(time+Math.min((now-previous)/1000,.1)*speed)%(duration*9);
  previous=now;
  render();
  frame=requestAnimationFrame(tick);
}
layout();
playback();
