/**
 * @typedef {Object} HttpModule
 * @property {function(string, Object=): HttpResponse} get - GET request
 * @property {function(string, Object, Object=): HttpModule} post - POST request
 * @property {function(string, Object, Object=): Promise<HttpResponse>} put - PUT request
 * @property {function(string, Object=): Promise<HttpResponse>} delete - DELETE request
 */

/**
 * @typedef {Object} HttpResponse
 * @property {number} status
 * @property {Object} data
 * @property {Object} headers
 */

/**
 * User represents a user in the system
 * @typedef {Object} User
 * @property {number} id - ID is the unique identifier
 * @property {string} name - Name is the user's full name
 * @property {string} email - Email is the user's email address
 * @property {boolean} isActive - IsActive indicates if the user is active
 * @property {Array<string>} tags - Tags are user tags
 * @property {function(): User} getFullName - GetFullName returns the user's full name
 * @property {function(newEmail): Error} updateEmail - UpdateEmail updates the user's email address
 * @property {function(tags): void} addTags - AddTags adds multiple tags to the user
 * @property {function(): [number, string]} getInfo - GetInfo returns user ID and name
 * @property {function(): [boolean, Error]} validate - Validate checks if the user data is valid
 */

function tasks(config, params) {
  http.setOauth(auth.auth(config.login));
  var url = "/api/v1/tasks/filter?query=";
  if (params.query != "" && params.query != undefined) {
    // go can't handle # in query params, so we need to replace
    // it with the approriate code.
    url = url + params.query.replaceAll("#", "%23");
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
