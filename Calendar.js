function onHomepageTrigger() {
  return showHomepageCard();
}

function onEventOpenTrigger(e) {
  try {
    // PropertiesService.getUserProperties().deleteProperty("SLACK_USER_TOKEN");
    // If slackUserToken doesn't exists, first ask the user to provide it by authorizing the Slaster app in slack.
    const slackUserToken = getSlackUserToken();
    if (!slackUserToken) return showAuthorizeSlackCard();

    // Get the event details
    const calendar = CalendarApp.getCalendarById(e.calendar.calendarId);
    const event = calendar.getEventById(e.calendar.id);
    if (!event) return showUnsavedEventCard();

    const emoji = event.getTag("slaster_emoji") || "";
    const message = event.getTag("slaster_message") || "";
    const dnd = (event.getTag("slaster_dnd") || String(false)) == "true";

    return showStatusFormCard(emoji, message, dnd, e.calendar.recurringEventId !== undefined);
  } catch (err) {
    console.error({
      message: "Failed to load/process event details",
      error: err
    });
    return showLoadingErrorCard();
  }
}
