function showNotification(message) {
  return CardService.newActionResponseBuilder()
      .setNotification(
          CardService.newNotification().setText(message),
          )
      .build();
}
