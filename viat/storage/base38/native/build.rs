fn main() {
  // Adds -Wl,-undefined,dynamic_lookup on macOS and embeds N-API version
  napi_build::setup();
}
