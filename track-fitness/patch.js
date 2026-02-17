const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace saveState
code = code.replace(
`function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}`,
`function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Sync to AWS if logged in
  if (state.auth && state.auth.currentUser) {
    const userId = state.auth.currentUser;
    state.activities.forEach(activity => {
      apiSaveWorkout(userId, activity).catch(console.error);
    });
  }
}

async function syncFromCloud() {
  if (state.auth && state.auth.currentUser) {
    try {
      const workouts = await apiGetWorkouts(state.auth.currentUser);
      if (workouts && workouts.length > 0) {
        state.activities = workouts.map(w => ({
          id: w.workoutId,
          date: w.date,
          type: w.type,
          duration: w.duration,
          distance: w.distance,
          notes: w.notes
        }));
        saveState();
        renderAll();
      }
    } catch(e) {
      console.error("Cloud sync failed, using local data", e);
    }
  }
}`
);

fs.writeFileSync('app.js', code);
console.log('Done!');
