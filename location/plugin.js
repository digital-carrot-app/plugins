function location(config, params) {
  var data = geofence.query(params.location, {});

  var enter = 0;
  var exit = 0;

  for (const e of data.records) {
    if (e.type == "exit") {
      exit++;
    }
    if (e.type == "enter") {
      enter++;
    }
  }

  return {
    is_in_location: data.isInLocationNow,
    time_in_location: data.secondsInLocation / 60,
    time_outside_location: data.secondsOutOfLocation / 60,
    exit_events: exit,
    enter_events: enter,
  };
}
