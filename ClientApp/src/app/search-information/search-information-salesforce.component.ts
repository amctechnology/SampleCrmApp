import { Component, Output, EventEmitter } from '@angular/core';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-search-information',
  templateUrl: './search-information-salesforce.component.html',
  styleUrls: ['./search-information-salesforce.component.css']
})
export class SearchInformationSalesforceComponent {
  @Output() agentSelectedCallerInformation: EventEmitter<any> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;
  lastCallerId: string;
  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor start');
    this.isSearchInformationMaximized = true;
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor complete');
  }
  protected onAgentSelectedCallerInformation(event) {
    if (this.storageService.searchReturnedSingleResult) {
      this.loggerService.logger.logDebug(`searchInformationComponent: Agent selected caller info: ${event.currentTarget.id}`);
      this.agentSelectedCallerInformation.emit(event.currentTarget.id);
    } else {
      if (this.lastCallerId !== event.currentTarget.value) {
        this.loggerService.logger.logDebug(`searchInformationComponent: Agent selected caller info: ${event.currentTarget.value}`);
        this.agentSelectedCallerInformation.emit(event.currentTarget.value);
        this.lastCallerId = event.currentTarget.value;
      }
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
    if (searchRecord.displayName) {
      name = searchRecord.displayName + ': ' + name;
    } else {
      // Lightning
      name = searchRecord.RecordType + ': ' + name;
    }
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
