const COMMENT = "Managed by Digital Carrot";

function enforce(pluginConfig, blockConfig) {
  if (pluginConfig.untrusted_https) {
    phApi.disableHTTPSVerification();
  }

  authedClient = authenticate(pluginConfig);
  groupId = checkGroup(authedClient, pluginConfig);

  // We may not be able to get the client's ip address. If we can't,
  // just skip setting up the client.
  try {
    checkClient(authedClient, groupId);
  } catch (e) {}
  checkBlocked(authedClient, blockConfig, groupId);
}

function checkClient(authedClient, groupId) {
  var ip = authedClient.getLocalIP();
  var path = "/api/clients/" + ip;
  var resp = authedClient.get(path);
  if (resp.statusCode == 200 && resp.body.json.clients.length == 1) {
    var cgroups = new Set(resp.body.json.clients[0].groups);

    if (
      !cgroups.has(groupId) ||
      resp.body.json.clients[0].comment !== COMMENT
    ) {
      authedClient.put(path, {
        json: {
          comment: COMMENT,
          groups: [groupId],
        },
      });
    }
  } else {
    authedClient.post("/api/clients", {
      json: {
        client: ip,
        comment: COMMENT,
        groups: [groupId],
      },
    });
  }
}

function checkGroup(authedClient, pluginConfig) {
  var res = authedClient.get("/api/groups/" + pluginConfig.group_name);
  var groupId = 0;

  if (res.statusCode == 200 && res.body.json.groups.length == 1) {
    var g = res.body.json.groups[0];
    groupId = g.id;
    if (!g.enabled || g.comment != COMMENT) {
      authedClient.put("/api/groups/" + pluginConfig.group_name, {
        json: {
          name: pluginConfig.group_name,
          enabled: true,
          comment: COMMENT,
        },
      });
    }
  } else {
    var res = authedClient.post("/api/groups/", {
      json: {
        name: pluginConfig.group_name,
        enabled: true,
        comment: COMMENT,
      },
    });
    if (res.statusCode != 201) {
      throw (
        "Could not create digital carrot group: " + res.body.json.error.message
      );
    }
    groupId = res.body.json.groups[0].id;
  }
  return groupId;
}

function checkBlocked(authedClient, blockConfig, groupId) {
  var block_domains = new Set([]);
  for (const b of blockConfig) {
    if (!b.isPaused) {
      for (const web of b.blockedItems.wildcard) {
        var domain = parseDomain(web);
        domain = domain.replaceAll(".", "\\.");
        block_domains.add("(\\.|^)" + domain + "$");
      }
    }
  }

  var current = authedClient.get("api/domains/");
  if (current.statusCode != 200) {
    throw "Could not get list of domains: " + current.body.json.error.message;
  }

  // go through all the configured domains
  //
  // if the domain is in the block list:
  //   check that it has the right metadata. Update if not
  //   pop domain from block list
  //
  // if the domain is not in the block list
  //   delete if managed by digital carrot
  //
  // for all domains that are left
  //   add them

  for (const d of current.body.json.domains) {
    if (block_domains.has(d.domain)) {
      if (d.type == "allow") {
        authedClient.delete(`/api/domains/allow/${d.kind}/${d.domain}`);
      } else if (mustUpdate(d, groupId)) {
        d.enabled = true;
        d.groups.push(groupId);
        d.groups = Array.from(new Set(d.groups));
        d.comment = COMMENT;
        authedClient.put("/api/domains/deny/regex/" + d.domain, {
          json: d,
        });
      }
      block_domains.delete(d.domain);
    } else {
      if (d.comment == COMMENT && d.enabled) {
        d.enabled = false;
        authedClient.put("/api/domains/deny/regex/" + d.domain, { json: d });
      }
    }
  }

  for (const toAdd of Array.from(block_domains)) {
    authedClient.post("/api/domains/deny/regex/", {
      json: getDomain(toAdd, [groupId]),
    });
  }
}

function authenticate(pluginConfig) {
  var sessionCache = sessionStorage.get();
  var sessionId = "";

  if (sessionCache.sid !== undefined) {
    var exp = Date.parse(sessionCache.expiration);
    if (Date.now() < exp) {
      sessionId = sessionCache.sid;
    }
  }

  if (sessionId == "") {
    var auth = phApi.post("/api/auth/", {
      json: { password: pluginConfig.password },
    });
    if (auth.statusCode != 200) {
      throw "Could not authenticate: " + auth.body.json.error.message;
    }
    sessionId = auth.body.json.session.sid;
    sessionCache = {
      sid: sessionId,
      expiration: (
        Date.now() +
        auth.body.json.session.validity * 1000
      ).toString(),
    };

    sessionStorage.save(sessionCache);
  }

  return phApi.withOptions({
    headers: { "X-FTL-SID": [sessionId] },
  });
}

function parseDomain(url) {
  if (typeof url !== "string" || !url) {
    return null;
  }

  // Regex pattern breakdown:
  // ^(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)? - Optional protocol (http://, https://, etc.)
  // (?:[^@\s]+@)?                      - Optional username:password@
  // ([^:\/\s?#]+)                      - Capture the domain (anything except :, /, whitespace, ?, #)
  // (?::\d+)?                          - Optional port number
  // (?:[\/\?#].*)?$                    - Optional path, query, or hash

  const match = url.match(
    /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)?(?:[^@\s]+@)?([^:\/\s?#]+)(?::\d+)?(?:[\/\?#].*)?$/,
  );

  return match ? match[1] : null;
}

function mustUpdate(domain, groupId) {
  if (!domain.enabled) {
    return true;
  }
  if (domain.comment != COMMENT) {
    return true;
  }

  // NOTE: goja does not support .isSupersetOf or .isSubsetOf
  var currentGroups = new Set(domain.groups);
  if (!currentGroups.has(groupId)) {
    return true;
  }

  return false;
}

function getDomain(name, groups) {
  return {
    domain: name,
    groups: groups,
    enabled: true,
    comment: COMMENT,
  };
}

function check_connection(data) {
  console.log(data);

  try {
    if (data.untrusted_https) {
      phApi.disableHTTPSVerification();
    }
    var auth = phApi.post("/api/auth/", {
      json: { password: data.password },
    });

    if (auth.statusCode == 401) {
      return { data: data, errors: { password: "Invalid password" } };
    }

    sessionId = auth.body.json.session.sid;

    // clear up the session
    phApi.delete("/auth/session/" + sessionId);
  } catch (e) {
    console.log("CAUGHT ERROR");
    console.log(e);
    return { data: data, errors: { url: "Could not connect to server" } };
  }

  return { data: data, errors: null };
}
