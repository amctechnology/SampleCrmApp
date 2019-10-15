import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-search-information',
  templateUrl: './search-information-salesforce.component.html',
  styleUrls: ['./search-information-salesforce.component.css']
})
export class SearchInformationSalesforceComponent {
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() agentSelectedCallerInformation: EventEmitter<any> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;
  lastCallerId: string;
  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor start');
    this.isSearchInformationMaximized = true;
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor complete');
  }

  protected expandCallerInformationSection() {
    this.isSearchInformationMaximized = true;
  }

  protected collapseCallerInformationSection() {
    this.isSearchInformationMaximized = false;
  }
  protected onAgentSelectedCallerInformation(event) {
    this.loggerService.logger.logDebug(`searchInformationComponent: Agent selected caller info: ${((this.searchRecordList.length === 1) ?
      event.currentTarget.id : event.currentTarget.value)}`, api.ErrorCode.SEARCH_RECORD);
    if (this.searchRecordList.length > 1) {
      this.storageService.selectedSearchRecordList[this.storageService.currentScenarioId] = event.currentTarget.value;
    }
    this.agentSelectedCallerInformation.emit(
      this.searchRecordList.find(i => i.id === ((this.searchRecordList.length === 1) ? event.currentTarget.id : event.currentTarget.value))
    );
  }
  protected parseSearchRecordForName(searchRecord: api.IRecordItem) {
    const keys = Object.keys(searchRecord.fields);
    let nameKey;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].includes('Name')) {
        nameKey = keys[i];
        break;
      }
    }
    let name = searchRecord.fields[nameKey].Value;
    name = (searchRecord.displayName ? (searchRecord.displayName + ': ' + name) : (searchRecord.type + ': ' + name) );
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
