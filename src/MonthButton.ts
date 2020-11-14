// @ts-ignore
import moment from 'moment';
import { FromToButton } from './FromToButton';

export class MonthButton extends FromToButton {
  constructor(layerSize: number, apiToken: string) {
    super(layerSize, apiToken, 'month');
  }
}
