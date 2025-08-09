function showUnsavedEventCard() {
  const header = CardService.newCardHeader().setTitle("Event Not Saved");
  const message = CardService.newTextParagraph().setText(
          "⚠️ Please save the event before using this feature."
        );
  const section = CardService.newCardSection()
        .addWidget(message);

  return CardService.newCardBuilder()
    .setHeader(header)
    .addSection(section)
    .build();
}

function showLoadingErrorCard() {
  const header = CardService.newCardHeader().setTitle("Error Loading Add-on");
  const message = CardService.newTextParagraph().setText(
        "❌ Something went wrong while loading the add-on."
      );
  const button = CardService.newTextButton()
        .setText("🔄 Retry")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("onEventAttachmentTrigger")
        );
  
  const section = CardService.newCardSection()
        .addWidget(message)
        .addWidget(button);

  return CardService.newCardBuilder()
    .setHeader(header)
    .addSection(section)
    .build();
}

function showStatusFormCard(emoji = "", message = "", dnd = false, showUpdateAllCheckbox = false) {
  // Explicitly set default values in case of null or undefined
  if (!emoji) emoji = "";
  if (!message) message = "";
  if (!dnd) dnd = false;

  // Create a text input for users to add the custom emoji
  const emojiValidation = CardService.newValidation()
    .setCharacterLimit(20)
    .setInputType(CardService.InputType.TEXT);
  const emojiInput = CardService.newTextInput()
    .setFieldName('emoji_input')
    .setTitle('Emoji')
    .setHint(':train:')
    .setValue(emoji)
    .setValidation(emojiValidation);
  
  // Create a text input for users to add the custom message
  const messageValidation = CardService.newValidation()
    .setCharacterLimit(100)
    .setInputType(CardService.InputType.TEXT);  
  const messageInput = CardService.newTextInput()
    .setFieldName('message_input')
    .setTitle('Message')
    .setHint('riding a train')
    .setValue(message)
    .setValidation(messageValidation);

  // Create a toggle switch to allow users to pause notifications
  const pauseNotificationsSwitch =
    CardService.newDecoratedText()
        .setText('Pause Notifications')
        .setSwitchControl(
            CardService.newSwitch()
                .setFieldName('dnd_switch_key')
                .setValue('true')
                .setSelected(dnd),
        );

  // Create a submit button to save these details
  const submitAction = CardService.newAction().setFunctionName('handleStatusFormSubmit');
  const submitBtn = CardService.newTextButton()
    .setText('Submit')
    .setOnClickAction(submitAction);

  // Assemble widgets and return the card
  var section = CardService.newCardSection()
      .addWidget(emojiInput)
      .addWidget(messageInput)
      .addWidget(pauseNotificationsSwitch)

  if (showUpdateAllCheckbox) {
    // Create a checkbox update all recurring events
    const updateAllEventsCheckbox =
      CardService.newDecoratedText()
          .setText('Update All Recurring Events')
          .setSwitchControl(
              CardService.newSwitch()
                  .setFieldName('update_all_events_checkbox')
                  .setControlType(CardService.SwitchControlType.CHECK_BOX)
                  .setValue('true'),
          );

    section = section.addWidget(updateAllEventsCheckbox);
  }

  section = section.addWidget(submitBtn);

  const card = CardService.newCardBuilder()
      .addSection(section);
  
  return card.build();
}

function handleStatusFormSubmit(e) {
  const formInputs = e.formInputs;
  const emoji = String(formInputs.emoji_input?.[0] || "").trim() ;
  const message = String(formInputs.message_input?.[0] || "").trim();
  const dnd = String(formInputs.dnd_switch_key?.[0] || false) == "true";
  const updateAllEvents = String(formInputs.update_all_events_checkbox?.[0] || false) == "true";

  try {
    // Get the event details
    const calendar = CalendarApp.getCalendarById(e.calendar.calendarId);
    var event = calendar.getEventById(e.calendar.id);
    if (e.calendar.recurringEventId && updateAllEvents) {
      // Get the master event
      event = calendar.getEventSeriesById(e.calendar.recurringEventId);
    }

    event.setTag("slaster_emoji", emoji);
    event.setTag("slaster_message", message);
    event.setTag("slaster_dnd", dnd);

    return showNotification("Details saved successfully!");
  } catch (err) {
    console.error({
      message: "Failed to save details",
      error: err
    })
    return showNotification("Couldn't save details, please retry!")
  }
}
