import { EventEmitter } from 'events';

const TogglClient = require('toggl-api');

enum Event {
  STARTED = 'started',
  STOPPED = 'stopped',
  UPDATED = 'updated',
}

export interface TogglState {
  startDate?: Date | null;
  isRunning: boolean;
  id?: number | null;
}

export class ToggleHandler {
  private togglClient: any;
  private toggleTimeEntryId: number | null;
  private startDate: Date | null;

  constructor(apiToken: string, private emitter = new EventEmitter()) {
    this.togglClient = new TogglClient({ apiToken });
    this.toggleTimeEntryId = null;
    this.startDate = null;
  }

  private async getCurrentTimeEntry(): Promise<{ start: string; id: number } | undefined> {
    return await new Promise((resolve: (data?: { start: string; id: number }) => void) => {
      this.togglClient.getCurrentTimeEntry(
        (error: Error | null, data: { start: string; id: number }) => {
          if (error === null && data === null) return resolve();
          return resolve(data);
        },
      );
    });
  }

  async setToCurrentTimeEntry() {
    const data = await this.getCurrentTimeEntry();
    if (data) {
      this.setState({
        id: data.id,
        startDate: new Date(data.start),
      });
    } else {
      this.setState({
        id: null,
        startDate: null,
      });
    }
  }

  getState() {
    const state: TogglState = {
      isRunning: !!this.toggleTimeEntryId,
      id: this.toggleTimeEntryId,
      startDate: this.startDate,
    };
    return state;
  }

  private setState(dataToSet?: Partial<TogglState>) {
    const state: TogglState = {
      ...this.getState(),
      ...dataToSet,
    };
    state.isRunning = !!state.id;

    this.startDate = state.startDate as Date | null;
    this.toggleTimeEntryId = state.id as number | null;
    this.emitter.emit(Event.UPDATED, state);
    return state;
  }

  getStartDate() {
    return this.startDate;
  }

  onUpdated(callback: (data: TogglState) => void) {
    this.emitter.on(Event.UPDATED, callback);
  }

  isRunning() {
    return this.toggleTimeEntryId !== null;
  }

  async start(): Promise<TogglState> {
    if (!this.isRunning()) {
      return await new Promise((resolve: (state: TogglState) => void) => {
        this.togglClient.startTimeEntry(
          {},
          async (error: Error, data: { start: string; id: number }) => {
            if (error === null && data === null) return;
            const currentState = this.setState({
              id: data.id,
              startDate: new Date(data.start),
            });
            resolve(currentState);
          },
        );
      });
    }

    return this.setState(this.getState());
  }

  async stop() {
    if (await this.isRunning()) {
      this.togglClient.stopTimeEntry(
        this.toggleTimeEntryId,
        async (error: Error, data: { start: string; id: number }) => {
          if (error === null && data === null) return;
          this.setState({
            id: null,
            startDate: null,
          });
        },
      );
    }
  }

  async getFromTo(startDate: Date, endDate: Date): Promise<number> {
    const timeEntries = await new Promise(
      (
        resolve: (timeEntries: { duration: number; stop?: Date }[]) => void,
        reject: (err: Error) => void,
      ) => {
        this.togglClient.getTimeEntries(
          startDate,
          endDate,
          (err: Error | undefined, timeEntries: { duration: number }[]) => {
            if (err) return reject(err);
            return resolve(timeEntries);
          },
        );
      },
    );
    let duration = 0;
    timeEntries.forEach(timeEntry => {
      if (timeEntry.duration > 0) {
        duration += timeEntry.duration;
      } else if (timeEntry.duration < 0 && timeEntry.stop === undefined) {
        duration += Math.floor(Date.now() / 1000 + timeEntry.duration);
      }
    });
    return duration;
  }
}
