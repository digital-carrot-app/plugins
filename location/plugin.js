function location(config, params) {
  var data = geofence.query(params.location, {});

  return {
    is_in_location: data.isInLocationNow,
    time_in_location: data.secondsInLocation / 60,
  };
}
