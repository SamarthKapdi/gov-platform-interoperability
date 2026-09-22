const stepExecutors = require('./step-executors');

const publishEvent = async (event) => {
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    await fetch(${process.env.EVENT_BUS_URL || \'http://localhost:3050\'}/events/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (err) {
    console.error('Failed to publish event:', err.message);
  }
};

const updateInstanceState = (db, id, update) => {
  const fields = Object.keys(update).map(k => `${k} = ?`).join(', ');
  const values = Object.values(update);
  values.push(new Date().toISOString());
  values.push(id);
  db.prepare(`UPDATE workflow_instances SET ${fields}, updated_at = ? WHERE id = ?`).run(...values);
};

const run = async (db, instanceId) => {
  let instance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(instanceId);
  if (!instance) return;
  if (['completed', 'failed', 'paused'].includes(instance.status)) return;

  const def = db.prepare('SELECT * FROM workflow_definitions WHERE id = ?').get(instance.workflow_id);
  const steps = JSON.parse(def.steps);
  let stepResults = JSON.parse(instance.step_results);

  while (instance.status === 'running') {
    const currentStepDef = steps.find(s => s.id === instance.current_step);
    if (!currentStepDef) {
      updateInstanceState(db, instanceId, { status: 'failed' });
      break;
    }

    if (currentStepDef.type === 'manual') {
      updateInstanceState(db, instanceId, { status: 'paused' });
      break;
    }

    // Auto step
    try {
      const result = await stepExecutors.execute(currentStepDef, instance);
      stepResults[currentStepDef.id] = result;
      
      const nextStepId = result.success ? currentStepDef.onSuccess : currentStepDef.onFailure;
      
      await publishEvent({
        type: 'WORKFLOW_STEP_COMPLETED',
        payload: { instanceId, stepId: currentStepDef.id, result }
      });

      if (['approved', 'rejected'].includes(nextStepId)) {
        updateInstanceState(db, instanceId, { 
          status: 'completed', 
          current_step: nextStepId,
          step_results: JSON.stringify(stepResults),
          completed_at: new Date().toISOString()
        });
        break;
      } else {
        updateInstanceState(db, instanceId, {
          current_step: nextStepId,
          step_results: JSON.stringify(stepResults)
        });
        instance.current_step = nextStepId;
      }
    } catch (err) {
      console.error(`Step ${currentStepDef.id} failed:`, err);
      stepResults[currentStepDef.id] = { success: false, error: err.message };
      updateInstanceState(db, instanceId, { 
        status: 'failed',
        step_results: JSON.stringify(stepResults)
      });
      break;
    }
  }
};

const proceedManualStep = (db, instanceId, approved, notes) => {
  const instance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(instanceId);
  const def = db.prepare('SELECT * FROM workflow_definitions WHERE id = ?').get(instance.workflow_id);
  const steps = JSON.parse(def.steps);
  const stepResults = JSON.parse(instance.step_results);
  
  const currentStepDef = steps.find(s => s.id === instance.current_step);
  
  stepResults[currentStepDef.id] = { success: approved, notes };
  const nextStepId = approved ? currentStepDef.onSuccess : currentStepDef.onFailure;

  const update = {
    status: ['approved', 'rejected'].includes(nextStepId) ? 'completed' : 'running',
    current_step: nextStepId,
    step_results: JSON.stringify(stepResults)
  };
  
  if (update.status === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  updateInstanceState(db, instanceId, update);
  
  publishEvent({
    type: 'WORKFLOW_STEP_COMPLETED',
    payload: { instanceId, stepId: currentStepDef.id, result: stepResults[currentStepDef.id] }
  });

  if (update.status === 'running') {
    setTimeout(() => {
      run(db, instanceId).catch(err => console.error(err));
    }, 0);
  }
};

module.exports = {
  run,
  proceedManualStep
};
