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
  @Input() searchLayout: api.SearchLayouts;
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() agentSelectedCallerInformation: EventEmitter<string> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;

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

  protected onAgentSelectedCallerInformation(event: any) {
    this.loggerService.logger.logDebug(`searchInformationComponent: Agent selected caller info: ${((this.searchRecordList.length === 1) ?
      event.currentTarget.id : event.currentTarget.value)}`, api.ErrorCode.SEARCH_RECORD);
    if (this.searchRecordList.length > 1) {
      this.storageService.selectedSearchRecordList[this.storageService.currentScenarioId] = event.currentTarget.value;
    }
    this.agentSelectedCallerInformation.emit(
      this.searchRecordList.find(i => i.id === ((this.searchRecordList.length === 1) ?
      event.currentTarget.id : event.currentTarget.value)).id
    );
  }

  protected parseSearchRecordForName(searchRecord: api.IRecordItem) {
    if (this.searchLayout && this.searchLayout.layouts) {
      const sLayoutInfo = this.searchLayout.layouts[0][this.storageService.getActivity().CallType].
      find(i => i.DevName === searchRecord.type);
      if (sLayoutInfo.DisplayFields && sLayoutInfo.DisplayFields[0].DevName) {
        const nameKey = sLayoutInfo.DisplayFields[0].DevName;
        const keys = Object.keys(searchRecord.fields);
        for (let i = 0; i < keys.length; i++) {
          if (searchRecord.fields[keys[i]] && searchRecord.fields[keys[i]].DevName === nameKey) {
            let displayRecord = searchRecord.fields[keys[i]].Value;
            displayRecord = (searchRecord.displayName ? (searchRecord.displayName + ': ' + displayRecord) :
            (searchRecord.type + ': ' + displayRecord) );
            return displayRecord;
          }
        }
      }
    }
    return '';
  }
}
