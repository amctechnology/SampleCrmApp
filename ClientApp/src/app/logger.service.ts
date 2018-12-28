import { Injectable, isDevMode } from '@angular/core';
import { Logger, LogSource, LogLevel } from '@amc/application-api';
import { environment } from '../environments/environment';

@Injectable()
export class LoggerService {

  public logger: Logger;
  constructor() {
    this.logger = new Logger(LogSource.SalesforceApp, false, environment.apiUrl);
  }

}
