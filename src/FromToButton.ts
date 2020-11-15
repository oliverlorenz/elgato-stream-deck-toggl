import { Button, Layer, ButtonInterface, TextOptions } from 'elgato-stream-deck-utils';

// @ts-ignore
import moment from 'moment';
import { ToggleHandler } from './TogglHandler';

export class FromToButton extends Button implements ButtonInterface {
  private interval: NodeJS.Timeout | undefined;
  private togglHandler: ToggleHandler;

  constructor(
    layerSize: number,
    apiToken: string,
    private unit: moment.unitOfTime.StartOf,
    private textOptions?: TextOptions,
  ) {
    super(layerSize);
    this.togglHandler = new ToggleHandler(apiToken);
  }

  get backgroundLayer(): Layer {
    return this.layer(0);
  }

  get imageLayer(): Layer {
    return this.layer(1);
  }

  get textLayer(): Layer {
    return this.layer(0);
  }

  private async updateText() {
    const duration = await this.togglHandler.getFromTo(
      moment().startOf(this.unit).toDate(),
      moment().endOf(this.unit).toDate(),
    );
    this.textLayer.image.setText(this.getTimeString(moment.duration(duration, 'seconds')), {
      color: 'white',
      size: 30,
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      ...this.textOptions,
    });
  }

  async activate() {
    await this.updateText();

    this.interval = setInterval(async () => {
      await this.updateText();
    }, 5000);
    super.activate();
  }

  private getTimeString(duration: moment.Duration): string {
    return duration.asHours().toFixed(2);
  }

  deactivate() {
    if (this.interval) {
      clearTimeout(this.interval);
    }
    super.deactivate();
  }
}
