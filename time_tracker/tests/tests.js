function configurePlugin(test) {
  test.configurePlugin({});
}

function configureDataSource(test) {
  configurePlugin(test);
  test.configureDataSource("tracked_time", "time_tracker", {
    tasks: ["wash the dishes", "work on the new thing", "read a book"],
  });
  test.runDataPlugin();
}

function testTimeTracker(test) {
  configureDataSource(test);
  test.testExpression("data.tracked_time.total_time == 0");
  test.setUserInput("tracked_time", { current_task: "wash the dishes" });
  test.runDataPlugin();

  sleep(1000);

  test.runDataPlugin();

  test.testExpression(
    "data.tracked_time.total_time > 0.001 && data.tracked_time.total_time < 0.10",
  );

  test.testExpression(
    `data.tracked_time.total_time == data.tracked_time.time_per_task["wash the dishes"]`,
  );
}

function testCancellation(test) {
  configureDataSource(test);

  test.testExpression("data.tracked_time.total_time == 0");

  test.setUserInput("tracked_time", { current_task: "wash the dishes" });
  test.runDataPlugin();
  sleep(1000);
  test.runDataPlugin();

  test.setUserInput("tracked_time", { current_task: "" });
  test.runDataPlugin();
  let total = test.runExpression("data.tracked_time.total_time");

  sleep(1000);
  test.runDataPlugin();

  if (total !== test.runExpression("data.tracked_time.total_time")) {
    test.fail("Failed to cancel timer");
  }
}

function testSwitchingTimers(test) {
  configureDataSource(test);

  test.testExpression("data.tracked_time.total_time == 0");
  test.runDataPlugin();

  test.setUserInput("tracked_time", { current_task: "wash the dishes" });
  test.runDataPlugin();
  sleep(1000);
  test.runDataPlugin();

  test.setUserInput("tracked_time", { current_task: "read a book" });
  test.runDataPlugin();

  sleep(1000);
  test.runDataPlugin();

  test.testExpression(
    `data.tracked_time.total_time > data.tracked_time.time_per_task["wash the dishes"]`,
  );
  test.testExpression(
    `data.tracked_time.total_time > data.tracked_time.time_per_task["read a book"]`,
  );
  test.testExpression(
    `data.tracked_time.total_time == data.tracked_time.time_per_task["wash the dishes"] + data.tracked_time.time_per_task["read a book"]`,
  );

  test.testExpression(
    `data.tracked_time.average_time == (data.tracked_time.time_per_task["wash the dishes"] + data.tracked_time.time_per_task["read a book"]) / 2`,
  );
}

function testQuickstart(test) {
  configurePlugin(test);
  var qs = test.createQuickStart("time_tracker", "single_task", {
    name: "my quickstart task",
    minutes: 10,
  });

  test.runDataPlugin();

  if (qs.condition.name != "Spend 10 minutes on 'my quickstart task'") {
    test.fail("wrong name");
  }

  resp = test.runExpressionWithDetails(qs.condition.expression);
  if (resp.progress.text != "0.0 / 10.") {
    test.fail("got " + resp.progress.text);
  }

  test.runDataPlugin();

  test.setUserInput(qs.condition.quickstart.function_instance_id, {
    current_task: "my quickstart task",
  });

  resp = test.runExpressionWithDetails(qs.condition.expression);
  if (resp.progress.text != "0.0 / 10. Current timer: my quickstart task") {
    test.fail(" got " + resp.progress.text);
  }

  test.runDataPlugin();
  sleep(1000);
  test.runDataPlugin();

  resp = test.runExpressionWithDetails(qs.condition.expression);
  if (resp.progress.badge.getPercentage().numerator == 0) {
    test.fail("expected progress to be greater than 0");
  }
}
