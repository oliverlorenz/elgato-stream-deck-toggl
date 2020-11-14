// @ts-ignore
import moment from 'moment';
import { FromToButton } from './FromToButton';

export class TodayButton extends FromToButton {
  constructor(layerSize: number, apiToken: string) {
    super(layerSize, apiToken, 'day');
  }
}
