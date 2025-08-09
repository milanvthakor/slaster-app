function doGet(e) {
  if (e.pathInfo !== "slack-slaster-auth") return;
  return handleSlackAuthCallback(e);
}
