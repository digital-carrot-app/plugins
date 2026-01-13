function test(config, params) {
  http.setOauth(auth.auth(config.login));
  const date = new Date().toISOString().split("T")[0];
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
