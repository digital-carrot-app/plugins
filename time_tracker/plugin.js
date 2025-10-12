function finishCurrentTask(currentTracking) {
  if (currentTracking.currentTask != "") {
    let startTime = Date.parse(currentTracking.currentStart);
    let elapsedMs = new Date() - startTime;

    // 60,000 ms in a minute
    let timeTracked = elapsedMs / 60000;

    if (currentTracking.taskCount[currentTracking.currentTask] === undefined) {
      currentTracking.taskCount[currentTracking.currentTask] = timeTracked;
    } else {
      currentTracking.taskCount[currentTracking.currentTask] += timeTracked;
    }

    currentTracking.currentTask = "";
    currentTracking.currentStart = "";
  }

  return currentTracking;
}

function initStorage(currentTracking) {
  if (currentTracking.taskCount === undefined) {
    currentTracking.taskCount = {};
    currentTracking.currentTask = "";
    currentTracking.currentStart = "";
  }
  return currentTracking;
}

function time_tracker(config, params) {
  // get the current stored time
  // initialize task picker if not already set
  // initialize cancel button if not already set
  //
  // if new task was selected
  //  set the new task as current
  //  if previous task was running
  //   calculate how much time was spent on the current task
  //   add the current time to the counter
  //
  // if cancel was selected
  //  set the the current task to none
  //  if previous task was running
  //   see above ^

  let schema = {
    type_input: "string",
    enum: params.tasks.concat([""]),
    title: "Start a timer",
    description: "Select a task to start timing",
    metadata: {
      uiSuggestions: [{ name: "Stop timer", value: "" }],
    },
  };

  var currentTime = savedTime.get();
  initStorage(currentTime);

  let fromUser = input.fetch("current_task");
  if (fromUser.schema === null) {
    params.tasks.push("");
    input.set(schema, "current_task", "");
  } else {
    if (currentTime.currentTask !== fromUser.value && fromUser.value !== null) {
      currentTime = finishCurrentTask(currentTime);
      if (fromUser.value === "") {
        currentTime.currentTask = "";
        currentTime.currentStart = "";
      } else {
        currentTime.currentTask = fromUser.value;
        currentTime.currentStart = Date().toString();
      }
    }
  }

  savedTime.save(currentTime);

  // Add the time on the current task to the current count
  let timeOnCurrent = 0;

  if (currentTime.currentTask != "" && currentTime.currentStart != "") {
    timeOnCurrent = (new Date() - Date.parse(currentTime.currentStart)) / 60000;
    if (isNaN(timeOnCurrent)) {
      timeOnCurrent = 0;
    }
  }

  if (currentTime.taskCount[currentTime.currentTask] === undefined) {
    currentTime.taskCount[currentTime.currentTask] = timeOnCurrent;
  } else {
    currentTime.taskCount[currentTime.currentTask] += timeOnCurrent;
  }

  let total = 0;
  let count = 0;

  for (let key in currentTime.taskCount) {
    total += currentTime.taskCount[key];
    count += 1;
  }

  let average = 0;
  if (count > 0) {
    average = total / count;
  }

  return {
    average_time: average,
    total_time: total,
    time_per_task: currentTime.taskCount,
    current_task: currentTime.currentTask,
  };
}
