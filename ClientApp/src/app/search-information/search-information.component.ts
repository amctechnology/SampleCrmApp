import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { LoggerService } from './../logger.service';
@Component({
  selector: 'app-search-information',
  templateUrl: './search-information.component.html',
  styleUrls: ['./search-information.component.css']
})
export class SearchInformationComponent {
  @Input() searchReturnedSingleResult: boolean;
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() agentSelectedCallerInformation: EventEmitter<string> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;
  constructor(private loggerService: LoggerService) {
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor start');
    this.isSearchInformationMaximized = true;
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor complete');
  }
  protected resizeSearchInformation(size) {
    if (size === 'collapse') {
      this.loggerService.logger.logDebug('searchInformationComponent: collapse window');
      this.isSearchInformationMaximized = false;
    } else {
      this.loggerService.logger.logDebug('searchInformationComponent: expand window');
      this.isSearchInformationMaximized = true;
    }
  }
  protected onAgentSelectedCallerInformation(event) {
    this.loggerService.logger.logDebug('searchInformationComponent: Agent selected caller info: ' +
      event.currentTarget.value);
    this.agentSelectedCallerInformation.emit(event.currentTarget.value);
  }
  protected parseSearchRecordForName(searchRecord) {
    const keys = Object.keys(searchRecord.fields);
    let nameKey;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].includes('Name')) {
        nameKey = keys[i];
        break;
      }
    }
    let name = searchRecord.fields[nameKey].Value;
    name = searchRecord.displayName + ': ' + name;

    return name;
  }
  protected getRecord(id) {
    for (let i = 0; i < this.searchRecordList.length; i++) {
      if (this.searchRecordList[i].id === id) {
        return this.searchRecordList[i];
      }
    }
  }
}
