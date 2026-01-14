function getLocalDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function activity_summary(config, params) {
  http.setOauth(auth.auth(config.login));
  const date = getLocalDateString();
  var resp = http.get(`/1/user/-/activities/date/${date}.json`);

  if (resp.statusCode != 200) {
    throw "Failed to retrieve data from fitbit.";
  }

  const out = resp.body.json;

  return {
    active_calories: out.summary.activityCalories,
    steps: out.summary.steps,
    lightly_active_minutes: out.summary.lightlyActiveMinutes,
    fairly_active_minutes: out.summary.fairlyActiveMinutes,
    very_active_minutes: out.summary.veryActiveMinutes,
  };
}
