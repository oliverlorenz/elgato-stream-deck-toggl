import 'source-map-support/register';
import { Device, ProfileManager } from 'elgato-stream-deck-utils';
import { TogglActivateButton } from './TogglActivateButton';
const device = new Device();

(async () => {
  device.waitForConnect(async streamDeck => {
    streamDeck.clearAllKeys();
    const profileManager = new ProfileManager(streamDeck);
    const profile0 = profileManager.getProfile(0);
    profile0.addButton(
      0,
      new TogglActivateButton(streamDeck.ICON_SIZE, 'b26c5970611b8977dcc389c3a9dced12'),
    );

    await profile0.activate();
    await profileManager.start();
  });
})();
