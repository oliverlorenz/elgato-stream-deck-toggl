import { Button, Layer, ButtonInterface } from 'elgato-stream-deck-utils';
import { readFileSync } from 'fs';
// @ts-ignore
import moment from 'moment';

var TogglClient = require('toggl-api');

export class TogglActivateButton extends Button implements ButtonInterface {
  private startDate: Date | undefined;
  private togglImageActive: Buffer;
  private togglImageInactive: Buffer;
  private interval: NodeJS.Timeout | undefined;
  private removeKeyUpToogleHandler: Function;
  private toggleTimeEntryId: number | undefined;
  private togglClient: any;

  constructor(layerSize: number, apiToken: string) {
    super(layerSize);
    this.togglClient = new TogglClient({ apiToken });
    this.togglImageActive = readFileSync('images/toggl_active.png');
    this.togglImageInactive = readFileSync('images/toggl_deactivated.png');
    this.removeKeyUpToogleHandler = () => {};
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

  activate() {
    this.imageLayer.image.setImage(this.togglImageInactive);
    this.removeKeyUpToogleHandler = this.onKeyUpToggle(this.start.bind(this), this.stop.bind(this));
    this.togglClient.getCurrentTimeEntry(
      (error: Error | null, data: { start: string; id: number }) => {
        if (error === null && data === null) return;
        this.startDate = new Date(data.start);
        this.toggleTimeEntryId = data.id;
        this.keyUpToggleState = false;
        this.start();
        this.imageLayer.image.setImage(this.togglImageActive);
      },
    );
    this.textLayer.image.setText(this.getDurationString(), {
      color: 'red',
      size: 30,
      posY: '95%',
    });
    super.activate();
  }

  deactivate() {
    if (this.interval) {
      clearTimeout(this.interval);
    }
    this.removeKeyUpToogleHandler();
    super.deactivate();
  }

  private getDurationString() {
    const duration = moment.duration(moment().diff(this.startDate));
    const seconds = duration.get('seconds');
    const minutes = duration.get('minutes');
    const hours = duration.get('hours');

    if (minutes > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  start() {
    if (!this.toggleTimeEntryId) {
      this.togglClient.startTimeEntry({}, (error: Error, data: { start: string; id: number }) => {
        if (error === null && data === null) return;
        this.startDate = new Date(data.start);
        this.toggleTimeEntryId = data.id;
        this.imageLayer.image.setImage(this.togglImageActive);
      });
    }
    this.backgroundLayer.image.setColor(255, 255, 255, 1);
    this.imageLayer.image.setImage(this.togglImageActive);
    this.textLayer.image.setText(this.getDurationString(), { color: 'red', size: 30, posY: '95%' });
    this.interval = setInterval(() => {
      this.textLayer.image.setText(this.getDurationString(), {
        color: 'red',
        size: 30,
        posY: '95%',
      });
    }, 1000);
  }

  stop() {
    if (this.toggleTimeEntryId) {
      this.togglClient.stopTimeEntry(
        this.toggleTimeEntryId,
        (error: Error, data: { start: string; id: number }) => {
          if (error === null && data === null) return;
          delete this.startDate;
          delete this.toggleTimeEntryId;
        },
      );
    }
    this.imageLayer.image.setImage(this.togglImageInactive);
    this.textLayer.image.clearImage();
    if (this.interval) {
      clearTimeout(this.interval);
    }
  }
}
