import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-search-information',
  templateUrl: './search-information-salesforce.component.html',
  styleUrls: ['./search-information-salesforce.component.css']
})
export class SearchInformationSalesforceComponent implements OnInit {
  @Input() searchLayout: api.SearchLayouts;
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() agentSelectedCallerInformation: EventEmitter<string> = new EventEmitter();
  isSearchInformationMaximized: boolean;
  imageLocation: string;
  singleMatchIconSrc: string;
  dataToShow: any;
  multiMatchDataToShow: any[];
  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor start');
    this.isSearchInformationMaximized = true;
    this.loggerService.logger.logDebug('searchInformationComponent: Constructor complete');
    this.dataToShow = null;
    this.multiMatchDataToShow = [];
  }
  ngOnInit() {
    if (this.searchRecordList.length === 1) {
      this.dataToShow = this.parseSearchRecordForNameSingleMatch(this.searchRecordList[0]);
    } else if (this.searchRecordList.length > 1) {
      for (let i = 0; i < this.searchRecordList.length; i++) {
        this.multiMatchDataToShow.push(this.parseSearchRecordForNameMultiMatch(this.searchRecordList[i]));
      }
    }
    console.log('asdf');
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

  protected parseSearchRecordForNameSingleMatch(searchRecord: api.IRecordItem) {
    const results = [];
    let src = '';
    if (searchRecord.type) {
      if (searchRecord.type.toUpperCase() === 'CONTACT') {
        src = '../../assets/images/Icon_Contact.png';
      } else if (searchRecord.type.toUpperCase() === 'ACCOUNT') {
        src = '../../assets/images/Icon_Account.png';
      } else if (searchRecord.type.toUpperCase() === 'LEAD') {
        src = '../../assets/images/Icon_Lead.png';
      } else {
        src = '../../assets/images/Miscellaneous_Icon.png';
      }
    }
    this.singleMatchIconSrc = src;
    if (this.searchLayout && this.searchLayout.layouts) {
      const sLayoutInfo = this.searchLayout.layouts[0][this.storageService.getActivity().CallType].
      find(i => i.DevName === searchRecord.type);
      for (let j = 0; j < sLayoutInfo.DisplayFields.length; j++) {
      if (sLayoutInfo.DisplayFields && sLayoutInfo.DisplayFields[j].DevName) {
        const nameKey = sLayoutInfo.DisplayFields[j].DevName;
        const keys = Object.keys(searchRecord.fields);
        for (let i = 0; i < keys.length; i++) {
          if (searchRecord.fields[keys[i]] && searchRecord.fields[keys[i]].DevName === nameKey) {
            let displayRecord = searchRecord.fields[keys[i]].Value;
            if (j === 0) {
              displayRecord = (searchRecord.displayName ? ([searchRecord.displayName, displayRecord]) :
              ([searchRecord.type, displayRecord]));
            } else {
              displayRecord = (sLayoutInfo.DisplayFields[j].DisplayName ?
              ([sLayoutInfo.DisplayFields[j].DisplayName, displayRecord]) :
              ([sLayoutInfo.DisplayFields[j].DevName, displayRecord]));
            }
            results.push(displayRecord);
          }
        }
      }
    }
    return results;
    }
    return '';
  }

  protected parseSearchRecordForNameMultiMatch(searchRecord: api.IRecordItem) {
    const results = [];
    let src = '';
    if (searchRecord.type) {
      if (searchRecord.type.toUpperCase() === 'CONTACT') {
        src = '../../assets/images/Icon_Contact.png';
      } else if (searchRecord.type.toUpperCase() === 'ACCOUNT') {
        src = '../../assets/images/Icon_Account.png';
      } else if (searchRecord.type.toUpperCase() === 'LEAD') {
        src = '../../assets/images/Icon_Lead.png';
      } else {
        src = '../../assets/images/Miscellaneous_Icon.png';
      }
    }
    if (this.searchLayout && this.searchLayout.layouts) {
      const sLayoutInfo = this.searchLayout.layouts[0][this.storageService.getActivity().CallType].
      find(i => i.DevName === searchRecord.type);
      for (let j = 0; j < sLayoutInfo.DisplayFields.length; j++) {
      if (sLayoutInfo.DisplayFields && sLayoutInfo.DisplayFields[j].DevName) {
        const nameKey = sLayoutInfo.DisplayFields[j].DevName;
        const keys = Object.keys(searchRecord.fields);
        for (let i = 0; i < keys.length; i++) {
          if (searchRecord.fields[keys[i]] && searchRecord.fields[keys[i]].DevName === nameKey) {
            let displayRecord = searchRecord.fields[keys[i]].Value;
            if (j === 0) {
              displayRecord = (searchRecord.displayName ? ([searchRecord.displayName, displayRecord]) :
              ([searchRecord.type, displayRecord]));
            } else {
              displayRecord = (sLayoutInfo.DisplayFields[j].DisplayName ?
              ([sLayoutInfo.DisplayFields[j].DisplayName, displayRecord]) :
              ([sLayoutInfo.DisplayFields[j].DevName, displayRecord]));
            }
            displayRecord.push(src);
            results.push(displayRecord);
            return results;
          }
        }
      }
    }
    return results;
    }
    return '';
  }

}
