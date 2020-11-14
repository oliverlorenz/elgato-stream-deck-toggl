import 'source-map-support/register';
import { Device, ProfileManager } from 'elgato-stream-deck-utils';
import { TogglActivateButton } from './TogglActivateButton';
import { TodayButton } from './TodayButton';
import { WeekButton } from './WeekButton';
import { MonthButton } from './MonthButton';
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
    profile0.addButton(
      1,
      new TodayButton(streamDeck.ICON_SIZE, 'b26c5970611b8977dcc389c3a9dced12'),
    );
    profile0.addButton(9, new WeekButton(streamDeck.ICON_SIZE, 'b26c5970611b8977dcc389c3a9dced12'));
    profile0.addButton(
      17,
      new MonthButton(streamDeck.ICON_SIZE, 'b26c5970611b8977dcc389c3a9dced12'),
    );

    await profile0.activate();
    await profileManager.start();
  });
})();
