/**
 * @param {GoogleAppsScript.Calendar.CalendarEvent} event
 * @param {string} slackUserToken
 * @param {GoogleAppsScript.Cache.Cache} cache
 * @param {Date} now
 */
function processEvent(event, slackUserToken, cache, now) {
  try {
    const eventId = event.getId();
    // An event has already been processed, skip it.
    if (cache.get(eventId) !== null) return;
    
    // Get Slaster details
    const emoji = event.getTag("slaster_emoji") || "";
    const message = event.getTag("slaster_message") || "";
    const dnd = (event.getTag("slaster_dnd") || String(false)) == "true";
    if (!emoji && !message && !dnd) return;

    const eventDuration = (event.getEndTime() - now) / 1000;
    const apiReqs = [];

    if (emoji || message) {
      const payload = {
          profile: {
              status_expiration: event.getEndTime().getTime() / 1000
          }
      }
      if (emoji) payload.profile.status_emoji = emoji;
      if (message) payload.profile.status_text = message;

      apiReqs.push({
        url: 'https://slack.com/api/users.profile.set',
        method: 'post',
        headers: {
          Authorization: "Bearer " + slackUserToken
        },
        contentType: 'application/json',
        payload: JSON.stringify(payload)
      });
    }

    if (dnd) {
      apiReqs.push({
        url: `https://slack.com/api/dnd.setSnooze?num_minutes=${Math.ceil(eventDuration/60)}`,
        method: 'post',
        headers: {
          Authorization: "Bearer " + slackUserToken
        },
      });
    }

    const resps = UrlFetchApp.fetchAll(apiReqs);
    const parsedResps = resps.map(resp => JSON.parse(resp.getContentText()));

    if (!parsedResps[0].ok) {
      console.error({
        message: "Failed to update status",
        respPayload: parsedResps[0]
      });
    } else if (!parsedResps[1].ok) {
      console.error({
        message: "Failed to set DND",
        respPayload: parsedResps[1]
      });
    } else {
      cache.put(eventId, "processed", eventDuration);
    }

    if (!parsedResps[0].ok || !parsedResps[1].ok) {
      // Delete the token from the system as request could get failed only if it becomes invalid.
      PropertiesService.getUserProperties().deleteProperty('SLACK_USER_TOKEN');
    }
  } catch (err) {
    console.error({
      message: "Failed to process event",
      error: err
    });
  }
}

function pollEvents() {
  try {
    const slackUserToken = PropertiesService.getUserProperties().getProperty('SLACK_USER_TOKEN');
    if (!slackUserToken) {
      console.warn("Slack is not authorized!")
      return
    }

    const cache = CacheService.getUserCache();

    // Get all the events that are happening in the next minute.
    const now = new Date();
    const minuteFromNow = new Date(now.getTime() + (60 * 1000));
    const events = CalendarApp.getDefaultCalendar().getEvents(now, minuteFromNow);

    // Sort events by its type
    events.sort((a, b) => {
      const aEventType = a.getEventType(), bEventType = b.getEventType();
      return getEventPriority(aEventType) - getEventPriority(bEventType);
    })

    for (const event of events) {
      // If user is not attending an event, skip it.
      // NOTE: If the event has been cancelled, `getEvents()` function won't return it. Hence, no need to handle that case.
      if (event.getMyStatus() === CalendarApp.GuestStatus.NO) continue;
      processEvent(event, slackUserToken, cache, now)

      // Don't process events further if either OutOfOffice or FocusTime type event has been processed.
      // Otherwise, subsequent events will override the status of the higher priority event.
      if ([CalendarApp.EventType.OUT_OF_OFFICE, CalendarApp.EventType.FOCUS_TIME].includes(event.getEventType())) break;
    }
  } catch (err) {
    console.error({
      message: "Failed to process poll events",
      error: err
    })
  }
}

function getEventPriority(type) {
  switch (type) {
    case CalendarApp.EventType.OUT_OF_OFFICE:
      return 0
    case CalendarApp.EventType.FOCUS_TIME:
      return 1
    default:
      return 2
  }
}