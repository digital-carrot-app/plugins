function configureDataSource(test) {
  test.configureDataSource("l", "location", {
    location: "my_location",
  });
  test.runDataPlugin();
}

function testLocationTime(test) {
  test.configurePlugin({});
  var now = Date.now();
  test.setLocationRecord("my_location", "enter", now - 3 * 60 * 60 * 1000);
  test.setLocationRecord("my_location", "exit", now - 1 * 60 * 60 * 1000);

  configureDataSource(test);
  test.runDataPlugin();

  test.testExpression("data.l.is_in_location == false");
  test.testExpression("data.l.time_in_location == 120");
  test.testExpression("data.l.exit_events == 1");
  test.testExpression("data.l.enter_events == 1");
  test.testExpression("data.l.time_outside_location > 0");

  test.setLocationRecord("my_location", "enter", now - 30 * 60 * 1000);
  test.runDataPlugin();

  test.testExpression("data.l.is_in_location == true");
  test.testExpression("data.l.time_in_location == 150");

  test.setLocationRecord("my_location", "exit", now - 15 * 60 * 1000);
  test.runDataPlugin();

  test.testExpression("data.l.is_in_location == false");
  test.testExpression("data.l.time_in_location == 135");
}
