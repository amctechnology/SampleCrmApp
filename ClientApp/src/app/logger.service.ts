import { Injectable, isDevMode } from '@angular/core';
import { Logger, LOG_SOURCE, LOG_LEVEL } from '@amc-technology/davinci-api';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class LoggerService {
  public logger: Logger;
  constructor(private configService: ConfigurationService) {
  }
  intialize() {
    this.logger = new Logger(LOG_SOURCE.SalesforceApp, false, this.configService.config.apiUrl);
  }

}
