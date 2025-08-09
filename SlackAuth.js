const SLACK_AUTH_STATE_MSG = "Authenticating with Slaster";

function getSlackAuthUrl() {
  const scriptProps = PropertiesService.getScriptProperties();
  const clientId = scriptProps.getProperty("SLACK_CLIENT_ID");
  // RedireURI Format: https://script.google.com/macros/s/<deployement_id>/exec/slack-slaster-auth
  const redirectUri = scriptProps.getProperty("SLACK_REDIRECT_URI");
  const scopes = 'users.profile:write,dnd:write';
  const state = Utilities.base64Encode(JSON.stringify({ message: SLACK_AUTH_STATE_MSG }));

  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

function getSlackUserToken() {
  return PropertiesService.getUserProperties().getProperty('SLACK_USER_TOKEN');
}

function showAuthorizeSlackCard() {
  const header = CardService.newCardHeader().setTitle("Authorize Slack");
  
  const message = CardService.newTextParagraph().setText(
        "To set your Slack status based on calendar events, please authorize your Slack account."
      );
  const link = CardService.newOpenLink()
                .setUrl(getSlackAuthUrl())
                .setOpenAs(CardService.OpenAs.OVERLAY)
                .setOnClose(CardService.OnClose.RELOAD);
  const button = CardService.newTextButton()
                  .setText('Authorize with Slack')
                  .setOpenLink(link);
  const section = CardService.newCardSection()
      .addWidget(message)
      .addWidget(button);

  return CardService.newCardBuilder()
    .setHeader(header)
    .addSection(section)
    .build();
}

function showError(message) {
  const html = `
    <html><body style="font-family:sans-serif;color:#b00020;">
      <h3>❌ Authorization Failed</h3>
      <p>${message}</p>
      <p>Please close this tab and try again from the add-on.</p>
      <button onclick="window.close()" style="margin-top:16px;padding:8px 12px;">Close</button>
    </body></html>
  `;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function handleSlackAuthCallback(e) {
  try {
    const code = e.parameter.code;
    if (!code)  return showError("Missing authorization code from Slack.");

    const state = JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.state)).getDataAsString());
    if (!state || !state.message || state.message !== SLACK_AUTH_STATE_MSG)
      return showError("Slack Authorization Failed! Please try again.")

    const scriptProps = PropertiesService.getScriptProperties();
    const clientId = scriptProps.getProperty("SLACK_CLIENT_ID");
    const redirectUri = scriptProps.getProperty("SLACK_REDIRECT_URI");
    const clientSecret = scriptProps.getProperty("SLACK_CLIENT_SECRET");

    const payload = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    };

    const response = UrlFetchApp.fetch('https://slack.com/api/oauth.v2.access', {
      method: 'post',
      payload
    });

    const data = JSON.parse(response.getContentText());
    if (!data.ok) return showError("Slack Authorization Failed! Please try again.");

    const userToken = data.authed_user.access_token;
    PropertiesService.getUserProperties().setProperty('SLACK_USER_TOKEN', userToken);
    
    return HtmlService.createHtmlOutput(`
      <html><body>
        <h3>✅ Slack authorization successful!</h3>
        <p>Please close this tab and return to the calendar add-on.</p>
        <script>
          setTimeout(() => window.close(), 1500);
        </script>
      </body></html>
    `);
  } catch (err) {
    console.error({
      message: "Failed to authorize with Slack",
      error: err
    });
    return showError("Something went wrong!");
  }
}
