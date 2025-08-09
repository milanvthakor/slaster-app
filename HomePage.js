function showHomepageCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("👋 Welcome to Slaster")
      .setSubtitle("Your calendar-aware Slack assistant")
    )

    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(
        "<b>Slaster</b> lets you automatically set your Slack status and pause notifications during calendar events — so you can stay focused without interruptions. 🔕💼"
      ))
      .addWidget(CardService.newTextParagraph().setText(
        "✨ Key Features:<br>" +
        "• Automatically sync Slack status with calendar events<br>" +
        "• Pause notifications (DND mode) during meetings<br>" +
        "• Customize Slack status per event<br>"
      ))
    )

    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(
        "📅 <b>To get started:</b><br>" +
        "• Save a calendar event<br>" +
        "• Click the <b>Slaster</b> attachment icon in the event view<br>" +
        "• Set your Slack status and DND preferences"
      ))
    );

  const slackUserToken = getSlackUserToken();
  if (!slackUserToken) {
    card
      .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(
        "Connect your Slack account to begin:"
      ))
      .addWidget(CardService.newTextButton()
        .setText("🔗 Connect Slack")
        .setOpenLink(CardService.newOpenLink()
          .setUrl(getSlackAuthUrl())
          .setOpenAs(CardService.OpenAs.OVERLAY)
          .setOnClose(CardService.OnClose.RELOAD)
        )
      )
    )
  } else {
    card
      .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText("You're connected to Slack."))
      .addWidget(CardService.newTextButton()
        .setText("❌ Disconnect Slack")
        .setOnClickAction(CardService.newAction()
          .setFunctionName("clearSlackUserToken")
        )
      )
    )
  }

  return card.build();
}

function clearSlackUserToken() {
  PropertiesService.getUserProperties().deleteProperty('SLACK_USER_TOKEN');
  
   return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation()
      .updateCard(showHomepageCard()) // Refresh current card
    )
    .build();
}