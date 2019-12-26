import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';

@Component({
  selector: 'app-search-information',
  templateUrl: './search-information-salesforce.component.html',
  styleUrls: ['./search-information-salesforce.component.css']
})

export class SearchInformationSalesforceComponent implements OnChanges {

  @Input() searchLayout: api.SearchLayouts;
  @Input() searchRecordList: Array<api.IRecordItem>;
  @Output() agentSelectedCallerInformation: EventEmitter<string> = new EventEmitter();

  isSearchInformationMaximized: boolean;
  imageLocation: string;
  singleMatchIconSrc: string;
  singleMatchData: any;
  multiMatchData: any[];
  shouldShowAllMultiMatchOptions: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.isSearchInformationMaximized = true;
    this.singleMatchData = null;
    this.multiMatchData = [];
    this.shouldShowAllMultiMatchOptions = false;
  }

  ngOnChanges() {
    this.renderData();
  }

  protected renderData() {
    try {
      this.loggerService.logger.logLoop('Salesforce - Search : START : Render Data called');
      this.singleMatchData = null;
      this.multiMatchData = [];
      this.shouldShowAllMultiMatchOptions = false;
      this.shouldShowAllMultiMatchOptions = false;
      if (this.searchRecordList.length === 1) {
        this.singleMatchData =
        this.parseSearchRecordForNameSingleMatch(this.storageService.searchRecordList[this.storageService.currentScenarioId][0]);
      } else if (this.searchRecordList.length > 1) {
        for (let i = 0; i < this.searchRecordList.length; i++) {
          this.multiMatchData.push(this.parseSearchRecordForNameMultiMatch(this.searchRecordList[i]));
        }
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : Render Data. Error Information : '
      + JSON.stringify(error));
    }
    this.loggerService.logger.logLoop('Salesforce - Search : END : Render Data called');
  }

  protected collapseCallerInfoResults() {
    this.shouldShowAllMultiMatchOptions = false;
  }
  protected expandCallerInfoResults() {
    this.shouldShowAllMultiMatchOptions = true;
  }
  protected expandCallerInformationSection() {
    this.isSearchInformationMaximized = true;
  }

  protected collapseCallerInformationSection() {
    this.isSearchInformationMaximized = false;
  }

  protected onAgentSelectedCallerInformation(event: any) {
    this.loggerService.logger.logTrace('Salesforce - Search : START : On Agent Selected Caller Information');
    try {
      if (this.searchRecordList.length > 1) {
        this.storageService.selectedSearchRecordList[this.storageService.currentScenarioId] = event.currentTarget.value;
        this.agentSelectedCallerInformation.emit(event.currentTarget.id);
      } else {
        this.agentSelectedCallerInformation.emit(this.searchRecordList.find(i => i.id === (this.searchRecordList.length === 1 ?
        event.currentTarget.id : event.currentTarget.value)).id);
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : On Agent Selected Caller Information. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Search : END : On Agent Selected Caller Information');
  }

  protected parseSearchRecordForNameSingleMatch(searchRecord: api.IRecordItem) {
    this.loggerService.logger.logTrace('Salesforce - Search : START : Parse Search Record For Name - Single Match');
    const results = [];
    try {
      const src = this.getEntityImgToDisplay(searchRecord);
      this.singleMatchIconSrc = src;
      const sLayoutInfo = this.getSearchLayoutInfoForDisplay(searchRecord);
      for (let j = 0; j < sLayoutInfo.DisplayFields.length; j++) {
        if (sLayoutInfo.DisplayFields && sLayoutInfo.DisplayFields[j].DevName) {
          const nameKey = sLayoutInfo.DisplayFields[j].DevName;
          const keys = Object.keys(searchRecord.fields);
          for (let i = 0; i < keys.length; i++) {
            if (
              searchRecord.fields[keys[i]] &&
              searchRecord.fields[keys[i]].DevName === nameKey
            ) {
              let displayRecord = searchRecord.fields[keys[i]].Value;
              if (j === 0) {
                displayRecord = searchRecord.displayName
                  ? [searchRecord.displayName, displayRecord]
                  : [searchRecord.type, displayRecord];
              } else {
                displayRecord = sLayoutInfo.DisplayFields[j].DisplayName
                  ? [sLayoutInfo.DisplayFields[j].DisplayName, displayRecord]
                  : [sLayoutInfo.DisplayFields[j].DevName, displayRecord];
              }
              results.push(displayRecord);
            }
          }
        }
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : Parse Search Record For Name - Single Match. Input : '
      + JSON.stringify(searchRecord) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Search : END : Parse Search Record For Name - Single Match');
    return results;
  }

  protected parseSearchRecordForNameMultiMatch(searchRecord: api.IRecordItem) {
    this.loggerService.logger.logTrace('Salesforce - Search : START : Parse Search Record For Name - Multi Match');
    const results = [];
    try {
      const src = this.getEntityImgToDisplay(searchRecord);
      const sLayoutInfo = this.getSearchLayoutInfoForDisplay(searchRecord);
      for (let j = 0; j < sLayoutInfo.DisplayFields.length; j++) {
        if (sLayoutInfo.DisplayFields && sLayoutInfo.DisplayFields[j].DevName) {
          const nameKey = sLayoutInfo.DisplayFields[j].DevName;
          const keys = Object.keys(searchRecord.fields);
          for (let i = 0; i < keys.length; i++) {
            if (
              searchRecord.fields[keys[i]] &&
              searchRecord.fields[keys[i]].DevName === nameKey
            ) {
              let displayRecord = searchRecord.fields[keys[i]].Value;
              if (j === 0) {
                displayRecord = searchRecord.displayName
                  ? [searchRecord.displayName, displayRecord]
                  : [searchRecord.type, displayRecord];
              } else {
                displayRecord = sLayoutInfo.DisplayFields[j].DisplayName
                  ? [sLayoutInfo.DisplayFields[j].DisplayName, displayRecord]
                  : [sLayoutInfo.DisplayFields[j].DevName, displayRecord];
              }
              displayRecord.push(src);
              results.push(displayRecord);
              return results;
            }
          }
        }
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : Parse Search Record For Name - Multi Match. Input : '
      + JSON.stringify(searchRecord) + '. Error Information : '
      + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Search : END : Parse Search Record For Name - Multi Match');
    return results;
  }

  protected getEntityImgToDisplay(searchRecord: api.IRecordItem) {
    let src = '';
    this.loggerService.logger.logTrace('Salesforce - Search : START : Get Entity Image to Display');
    try {
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
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : Get Entity Image to Display. Input : '
      + JSON.stringify(searchRecord) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Search : END : Get Entity Image to Display');
    return src;
  }

  protected getSearchLayoutInfoForDisplay(searchRecord: api.IRecordItem) {
    this.loggerService.logger.logTrace('Salesforce - Search : START : Get Search Layout Info for Display');
    let layoutInfo = null;
    try {
      layoutInfo = this.searchLayout.layouts[0][this.storageService.getActivity().CallType].find(i => i.DevName === searchRecord.type);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Search : ERROR : Get Search Layout Info for Display. Input : '
      + JSON.stringify(searchRecord) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Search : END : Get Search Layout Info for Display');
    return layoutInfo;
  }
}
