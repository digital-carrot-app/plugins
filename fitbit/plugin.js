function getLocalDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function activity_summary(config, params) {
  var tokens = token_store.get();
  if (tokens.original_refresh !== config.login.refresh_token) {
    tokens = {
      original_refresh: config.login.refresh_token,
      access_token: config.login.access_token,
      refresh_token: config.login.refresh_token,
    };
    token_store.save(tokens);
  }

  authorized = http.withOptions({
    headers: {
      authorization: ["Bearer " + tokens.access_token],
      "Content-Type": ["application/x-www-form-urlencoded"],
    },
  });

  var isValid = authorized.post("/1.1/oauth2/introspect", {
    string: `token=${tokens.access_token}`,
  });

  if (isValid.body.json.success === false) {
    try {
      var withUrlEncoded = http.withOptions({
        headers: { "Content-Type": ["application/x-www-form-urlencoded"] },
      });

      var newCreds = withUrlEncoded.post("/oauth2/token", {
        string: `client_id=23TW6D&grant_type=refresh_token&refresh_token=${tokens.refresh_token}`,
      });
      if (newCreds.statusCode == 400) {
        console.log(newCreds.body.string);
        throw "Please login again by going to Settings > Plugins > Fitbit";
      }

      tokens.access_token = newCreds.body.json.access_token;
      tokens.refresh_token = newCreds.body.json.refresh_token;
      token_store.save(tokens);

      authorized = http.withOptions({
        headers: { authorization: ["Bearer " + tokens.access_token] },
      });
    } catch (e) {
      console.log(e);
      throw "Please login again by going to Settings > Plugins > Fitbit";
    }
  }

  const date = getLocalDateString();
  var resp = authorized.get(`/1/user/-/activities/date/${date}.json`);

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
