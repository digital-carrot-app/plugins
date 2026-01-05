// The function name (example_function) must match the key that we defined in
// data_plugin.exports.
//
// The config object corresponds to the schema we defined in my_config_schema.
//
// The params object corresponds to the schema we defined in example_params.
//
// This function MUST output an object that is valid according to it's output_schema,
// in this case, that would be the "example_out" schema.
function example_function(config, params) {
  // We can use our http_client object defined in imports to make REST calls to
  // example.com. Note that the plugin can ONLY make API calls to the url provided
  // to the manifest.
  //
  // my_http_client.get("/")

  return {
    multiplied: config.plugin_number * params.function_number,
  };
}
