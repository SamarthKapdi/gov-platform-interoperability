const generateDiagram = (steps, instance) => {
  let stepStates = {};
  if (instance) {
    const results = JSON.parse(instance.step_results || '{}');
    
    for (const step of steps) {
      if (results[step.id]) {
        stepStates[step.id] = results[step.id].success ? 'completed' : 'failed';
      } else if (instance.current_step === step.id) {
        if (instance.status === 'paused') {
          stepStates[step.id] = 'paused';
        } else if (instance.status === 'failed') {
          stepStates[step.id] = 'failed';
        } else {
          stepStates[step.id] = 'current';
        }
      } else {
        stepStates[step.id] = 'pending';
      }
    }
  } else {
    for (const step of steps) stepStates[step.id] = 'pending';
  }

  const getColor = (state) => {
    switch (state) {
      case 'completed': return '#4ade80'; // green
      case 'failed': return '#f87171'; // red
      case 'current': return '#60a5fa'; // blue
      case 'paused': return '#fbbf24'; // yellow
      default: return '#9ca3af'; // gray
    }
  };

  const getAnimation = (state) => {
    if (state === 'current' || state === 'paused') {
      return `<animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />`;
    }
    return '';
  };

  const boxWidth = 220;
  const boxHeight = 80;
  const xSpacing = 260;
  const yOffset = 160;
  const startX = 50;

  let nodesHtml = '';
  let edgesHtml = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const state = stepStates[step.id];
    const color = getColor(state);
    
    const cx = startX + i * xSpacing;
    const cy = yOffset;

    nodesHtml += `
      <g transform="translate(${cx}, ${cy})">
        <rect width="${boxWidth}" height="${boxHeight}" rx="8" fill="${color}" stroke="#333" stroke-width="2">
          ${getAnimation(state)}
        </rect>
        <text x="${boxWidth/2}" y="35" font-family="sans-serif" font-size="14" font-weight="bold" fill="#fff" text-anchor="middle">
          ${step.name}
        </text>
        <text x="${boxWidth/2}" y="55" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">
          [${step.type.toUpperCase()}] ${step.department}
        </text>
      </g>
    `;

    if (i < steps.length - 1) {
      const nextStepId = step.onSuccess;
      if (nextStepId === steps[i+1].id) {
        const startEdgeX = cx + boxWidth;
        const startEdgeY = cy + boxHeight / 2;
        const endEdgeX = cx + xSpacing;
        const endEdgeY = cy + boxHeight / 2;

        edgesHtml += `
          <line x1="${startEdgeX}" y1="${startEdgeY}" x2="${endEdgeX}" y2="${endEdgeY}" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)" />
        `;
      }
    }
  }

  const svg = `
    <svg width="${Math.max(800, startX + steps.length * xSpacing)}" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="#f3f4f6" />
      <text x="${Math.max(400, (startX + steps.length * xSpacing)/2)}" y="50" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1f2937" text-anchor="middle">
        Skill Certificate Verification Workflow
      </text>
      ${edgesHtml}
      ${nodesHtml}
    </svg>
  `;

  return svg.trim();
};

module.exports = generateDiagram;
