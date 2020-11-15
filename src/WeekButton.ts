// @ts-ignore
import moment from 'moment';
import { FromToButton } from './FromToButton';

export class WeekButton extends FromToButton {
  constructor(layerSize: number, apiToken: string) {
    // @ts-ignore
    super(layerSize, apiToken, 'isoweek');
  }
}
