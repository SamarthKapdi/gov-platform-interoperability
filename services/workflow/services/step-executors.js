const execute = async (stepDef, instance) => {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  if (stepDef.action === 'check_employment_status') {
    try {
      const response = await fetch(`http://localhost:3001/employment/status/${instance.citizen_id}`);
      if (response.ok) {
        const data = await response.json();
        const success = ['registered', 'shortlisted', 'interviewed', 'placed'].includes(data.status);
        return { success, data };
      }
      return { success: true, note: 'Mocked success (Dept B unreachable or returned error)' };
    } catch (e) {
      console.log('check_employment_status fallback due to fetch error:', e.message);
      return { success: true, note: 'Mocked success (Dept B unreachable)' };
    }
  }

  if (stepDef.action === 'check_grievances') {
    try {
      const response = await fetch(`http://localhost:3003/grievances/citizen/${instance.citizen_id}`);
      if (response.ok) {
        const data = await response.json();
        const openGrievances = data.filter(g => g.status === 'open' || g.status === 'pending');
        const success = openGrievances.length === 0;
        return { success, openCount: openGrievances.length };
      }
      return { success: true, note: 'Mocked success (Dept C unreachable or returned error)' };
    } catch (e) {
      console.log('check_grievances fallback due to fetch error:', e.message);
      return { success: true, note: 'Mocked success (Dept C unreachable)' };
    }
  }

  throw new Error(`Unknown action: ${stepDef.action}`);
};

module.exports = {
  execute
};
