import { Button, Layer, ButtonInterface } from 'elgato-stream-deck-utils';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TogglState } from './TogglHandler';

// @ts-ignore
import moment from 'moment';
import { ToggleHandler } from './TogglHandler';

export class TogglActivateButton extends Button implements ButtonInterface {
  private togglImageActive: Buffer;
  private togglImageInactive: Buffer;
  private interval: NodeJS.Timeout | undefined;
  private removeKeyUpToogleHandler: Function;
  private backgroundUpdateInterval: NodeJS.Timeout | undefined;
  private togglHandler: ToggleHandler;

  constructor(layerSize: number, apiToken: string) {
    super(layerSize);
    this.togglHandler = new ToggleHandler(apiToken);
    this.togglImageActive = readFileSync(resolve(__dirname, '../images/toggl_active.png'));
    this.togglImageInactive = readFileSync(resolve(__dirname, '../images/toggl_deactivated.png'));
    this.removeKeyUpToogleHandler = () => {};

    this.togglHandler.onUpdated((data: TogglState) => {
      if (data.isRunning) {
        this.startInterval();
        this.imageLayer.image.setImage(this.togglImageActive);
        this.textLayer.image.setText(this.getDurationString(), {
          color: 'red',
          size: 30,
          posY: '95%',
        });
      } else {
        this.stopInterval();
        this.imageLayer.image.setImage(this.togglImageInactive);
        this.textLayer.image.clearImage();
      }
    });
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

  async activate() {
    this.removeKeyUpToogleHandler = this.onKeyUpToggle(this.start.bind(this), this.stop.bind(this));
    if (this.togglHandler.getState().isRunning) {
      this.keyUpToggleState = false;
    }
    this.backgroundUpdateInterval = setInterval(() => {
      this.togglHandler.setToCurrentTimeEntry();
    }, 5000);
    this.togglHandler.setToCurrentTimeEntry();
    super.activate();
  }

  deactivate() {
    if (this.interval) {
      clearTimeout(this.interval);
    }
    if (this.backgroundUpdateInterval) {
      clearInterval(this.backgroundUpdateInterval);
      delete this.backgroundUpdateInterval;
    }
    this.removeKeyUpToogleHandler();
    super.deactivate();
  }

  private getDurationString() {
    const duration = moment.duration(moment().diff(this.togglHandler.getStartDate()));
    const seconds = duration.get('seconds');
    const minutes = duration.get('minutes');
    const hours = duration.get('hours');

    if (minutes > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  startInterval() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.textLayer.image.setText(this.getDurationString(), {
        color: 'red',
        size: 30,
        posY: '95%',
      });
    }, 1000);
  }

  stopInterval() {
    if (!this.interval) return;
    clearTimeout(this.interval);
    delete this.interval;
  }

  start() {
    this.togglHandler.start();
  }

  stop() {
    this.togglHandler.stop();
  }
}
