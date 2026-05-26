function getLocalDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function activity_summary(config, params) {
  http.setOauth(auth.auth(config.login));

  var response = http.get(
    `v2/usercollection/daily_activity?start_date=${getLocalDateString()}`,
  );

  switch (response.statusCode) {
    case 200:
      var data = {
        steps: 0,
        active_calories: 0,
        distance: 0,
      };

      if (response.body.json.data.length > 0) {
        var activity = response.body.json[0];
        data.steps = activity.steps;
        data.active_calories = activity.active_calories;
        data.distance = activity.equivalent_walking_distance;
      }
      return data;

    case 401:
      throw new Error(
        "Login expired. Go to Settings -> Plugins -> Oura to log back in.",
      );
    default:
      throw new Error(
        "Unable to access the Oura API. This could be because your Oura subscription has expired or because the Oura API is currently unavailable.",
      );
  }
}
