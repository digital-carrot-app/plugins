function testTimeTracker(test) {
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
