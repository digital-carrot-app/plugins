function tasks(config, params) {
  http.setOauth(auth.auth(config.login));
  var url = "/api/v1/tasks/filter?query=";
  if (params.query != "" && params.query != undefined) {
    // go can't handle # (and maybe &) in query params, so we need to replace
    // it with the approriate code.
    var q = params.query.replaceAll("#", "%23");
    q = params.query.replaceAll("&", "%26");
    url = url + q;
  } else {
    url = url + "all";
  }
  var res = http.get(url);
  var outTasks = Array();

  var count = 0;
  var done = 0;
  var pending = 0;

  while (true) {
    if (res.statusCode == 200) {
      var items = res.body.json.results;
      for (const t of items) {
        outTasks.push({
          added_at: t.added_at,
          checked: t.checked,
          completed_at: t.completed_at,
          content: t.content,
          due: t.due,
          id: t.id,
          labels: t.labels,
          note_count: t.note_count,
          priority: t.priority,
          updated_at: t.updated_at,
        });
        count += 1;
        if (t.checked) {
          done += 1;
        } else {
          pending += 1;
        }
      }
    } else {
      throw new Error("API error");
    }
    if (res.body.json.next_cursor == undefined) {
      break;
    } else {
      res = http.get(url + "&cursor=" + res.body.json.next_cursor);
    }
  }

  return {
    all_tasks_count: count,
    finished_tasks_count: done,
    pending_tasks_count: pending,
    tasks: outTasks,
  };
}
