import { Injectable, isDevMode } from '@angular/core';
import { Logger, LogSource, LogLevel } from '@amc/davinci-api';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class LoggerService {
  public logger: Logger;
  constructor(private configService: ConfigurationService) {
  }
  intialize() {
    this.logger = new Logger(LogSource.SalesforceApp, false, this.configService.config.apiUrl);
  }

}
