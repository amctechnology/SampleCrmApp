import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { LoggerService } from './../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-search-information',
  templateUrl: './search-information.component.html',
  styleUrls: ['./search-information.component.css']
})
export class SearchInformationComponent {
  @Output() agentSelectedCallerInformation: EventEmitter<string> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;
  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor start');
    this.isSearchInformationMaximized = true;
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor complete');
  }
  protected onAgentSelectedCallerInformation(event) {
    if (event.currentTarget.id !== '') {
      this.loggerService.logger.logDebug('searchInformationComponent: Agent selected caller info: ' +
        event.currentTarget.id);
      this.agentSelectedCallerInformation.emit(event.currentTarget.id);
    } else {
      this.loggerService.logger.logDebug('searchInformationComponent: Agent selected caller info: ' +
        event.currentTarget.value);
      this.agentSelectedCallerInformation.emit(event.currentTarget.value);
    }
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
    for (let i = 0; i < this.storageService.searchRecordList.length; i++) {
      if (this.storageService.searchRecordList[i].id === id) {
        return this.storageService.searchRecordList[i];
      }
    }
  }
}
