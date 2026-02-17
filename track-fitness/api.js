const API_URL = "https://8xl4wrl5mj.execute-api.us-west-1.amazonaws.com/prod/workouts";

async function apiGetWorkouts(userId) {
  const res = await fetch(`${API_URL}?userId=${userId}`);
  return await res.json();
}

async function apiSaveWorkout(userId, activity) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...activity })
  });
  return await res.json();
}

async function apiDeleteWorkout(userId, workoutId) {
  const res = await fetch(API_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, workoutId })
  });
  return await res.json();
}
