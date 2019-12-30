import * as api from '@amc-technology/davinci-api';
import { IInteraction } from '@amc-technology/davinci-api';
import { IActivity } from './Model/IActivity';
import { IActivityDetails } from './Model/IActivityDetails';
import { Injectable } from '@angular/core';
import { IActivityFields } from './Model/IActivityFields';
import { LoggerService } from './logger.service';
@Injectable()
export class StorageService {
  public whoList: {
    [scenarioId: string]: IActivityDetails[];
  };
  public whatList: {
    [scenarioId: string]: IActivityDetails[];
  };
  public currentScenarioId: string;
  public workingRecentScenarioId: string;
  public activityList: {
    [scenarioId: string]: IActivity;
  };
  public currentTicketId: string;
  public recentScenarioIdList: string[];
  public activeScenarioIdList: string[];
  public expiredScenarioIdList: string[];
  public searchRecordList: {
    [scenarioId: string]: api.IRecordItem[];
  };
  public selectedWhatValueList: {
    [key: string]: string;
  };
  public selectedWhoValueList: {
    [key: string]: string;
  };
  public selectedSearchRecordList: {
    [key: string]: string;
  };
  public nameChangesList: string[];
  public relatedToChangesList: string[];
  public maxExpiredItems: Number;
  public maxRecentItems: Number;
  public scenarioToCADMap: {
    [scenarioId: string]: any;
  };
  public scenarioToCallerInfoMap: {
    [scenarioId: string]: any;
  };
  public emptyIActivityDetails: IActivityDetails;
  public savedActivityFields: {
    [scenarioId: string]: IActivityFields
  };

  constructor(private loggerService: LoggerService) {
    this.whoList = {};
    this.whatList = {};
    this.currentScenarioId = null;
    this.workingRecentScenarioId = null;
    this.activityList = {};
    this.recentScenarioIdList = [];
    this.activeScenarioIdList = [];
    this.expiredScenarioIdList = [];
    this.searchRecordList = {};
    this.selectedWhatValueList = {};
    this.selectedWhoValueList = {};
    this.selectedSearchRecordList = {};
    this.nameChangesList = [];
    this.relatedToChangesList = [];
    this.maxRecentItems = 0;
    this.maxExpiredItems = 2;
    this.currentTicketId = '';
    this.scenarioToCADMap = {};
    this.scenarioToCallerInfoMap = {};
    this.emptyIActivityDetails = {
      displayName: '',
      objectId: '',
      objectName: '',
      objectType: '',
      url: ''
    };
    this.savedActivityFields = {};
  }

  public setCurrentScenarioId(currentScenarioId: string) {
    try {
      this.currentScenarioId = currentScenarioId;
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Current Scenario ID for Scenario ID : '
      + currentScenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public getActivity(scenarioId: string = null): IActivity {
    try {
      if (!scenarioId) {
        scenarioId = this.currentScenarioId;
      }
      if (this.activityList[scenarioId]) {
        return this.activityList[scenarioId];
      }
      return null;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get Activity for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public recentActivityListContains(scenarioId: string): boolean {
    try {
      return this.activityList[scenarioId] && !this.activityList[scenarioId].IsActive ? true : false;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Check if Exists in Recent Activity List for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private addRecentActivity(activity: IActivity) {
    try {
      const deleteExpiredActivity = this.expiredScenarioIdList.length === this.maxExpiredItems && this.maxRecentItems === 0;
      if (Object.keys(this.recentScenarioIdList).length === this.maxRecentItems || this.maxRecentItems === 0) {
        const scenarioId =
          this.maxRecentItems === 0
            ? deleteExpiredActivity
              ? this.expiredScenarioIdList.pop()
              : activity.ScenarioId
            : this.recentScenarioIdList.pop();
        this.clearWhatList(scenarioId);
        this.clearWhoList(scenarioId);
        delete this.selectedWhatValueList[scenarioId];
        delete this.selectedWhoValueList[scenarioId];
        if (this.maxRecentItems !== 0 || deleteExpiredActivity) {
          delete this.savedActivityFields[scenarioId];
          delete this.activityList[scenarioId];
        }
      }
      if (this.maxRecentItems !== 0) {
        this.recentScenarioIdList.unshift(activity.ScenarioId);
      } else {
        this.expiredScenarioIdList.unshift(activity.ScenarioId);
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Add Recent Activity for Scenario ID : '
      + activity.ScenarioId + ', Activity Info : ' + JSON.stringify(activity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public addActivity(activity: IActivity) {
    try {
      this.activityList[activity.ScenarioId] = activity;
      this.activeScenarioIdList.push(activity.ScenarioId);
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Add Activity for Scenario ID : '
      + activity.ScenarioId + ', Activity Info : ' + JSON.stringify(activity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public updateActivity(activity: IActivity) {
    try {
      if (this.activityList[activity.ScenarioId]) {
        this.activityList[activity.ScenarioId] = activity;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update Activity for Scenario ID : '
      + activity.ScenarioId + ', Activity Info : ' + JSON.stringify(activity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private removeActivity(scenarioId: string) {
    try {
      if (this.activityList[scenarioId]) {
        this.addRecentActivity(this.activityList[scenarioId]);
        this.activeScenarioIdList = this.activeScenarioIdList.filter(id => id !== scenarioId);
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Remove Activity for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private activityListContains(scenarioId: string): boolean {
    try {
      return this.activityList[scenarioId] ? true : false;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Check if Exists in Activity List for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public getSubject(): string {
    try {
    return this.getActivity().Subject;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get Subject. Error Information : ' + JSON.stringify(error));
    }
  }

  public setSubject(subject: string, scenarioId: string) {
    try {
      if (this.activityList[scenarioId]) {
        this.activityList[scenarioId].Subject = subject;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Subject for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public getDescription(): string {
    try {
      return this.getActivity().Description;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get Description. Error Information : ' + JSON.stringify(error));
    }
  }

  public setDescription(description: string, scenarioId: string) {
    try {
      if (this.activityList[scenarioId]) {
        this.activityList[scenarioId].Description = description;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Description for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public setActivityField(scenarioId: string, activityField: string, activityValue: any) {
    try {
      if (this.activityList[scenarioId]) {
        this.activityList[scenarioId][activityField] = activityValue;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Activity Field for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private setActivityWhoObject(whoObject: IActivityDetails, scenarioId: string) {
    try {
      if (this.activityList[scenarioId]) {
        this.activityList[scenarioId].WhoObject = whoObject;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Activity Who Object for Scenario ID : '
      + scenarioId + ', What Object : ' + JSON.stringify(whoObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private setActivityWhatObject(whatObject: IActivityDetails, scenarioId: string) {
    try {
      if (this.activityList[scenarioId]) {
        this.activityList[scenarioId].WhatObject = whatObject;
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Activity What Object for Scenario ID : '
      + scenarioId + ', What Object : ' + JSON.stringify(whatObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public UpdateWhoObjectSelectionChange(whoObjectId: string, scenarioId: string) {
    try {
      const currentWhoObject = this.getWhoObject(whoObjectId, scenarioId);
      if (this.currentScenarioId === scenarioId) {
        this.nameChangesList.push(scenarioId);
      }
      if (currentWhoObject.objectType.toUpperCase() === 'LEAD') {
        this.selectedWhatValueList[scenarioId] = this.emptyIActivityDetails.objectId;
        this.setActivityWhatObject(this.emptyIActivityDetails, scenarioId);
      }
      this.setActivityWhoObject(currentWhoObject, scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update Who Object Selection Change for Scenario ID : '
      + scenarioId + ', Who Object ID : ' + whoObjectId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public UpdateWhatObjectSelectionChange(whatObjectId: string, scenarioId: string) {
    try {
      const currentWhatObject = this.getWhatObject(whatObjectId, scenarioId);
      if (this.currentScenarioId === scenarioId) {
        this.relatedToChangesList.push(scenarioId);
      }
      this.setActivityWhatObject(currentWhatObject, scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update What Object Selection Change for Scenario ID : '
      + scenarioId + ', What Object ID : ' + whatObjectId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private getWhatObject(whatId: string, scenarioId: string): IActivityDetails {
    try {
      if (whatId === 'UserSelectedForEmptyRecord') {
        return this.emptyIActivityDetails;
      }
      return this.whatList[scenarioId].find(item => item.objectId === whatId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get What Object for Scenario ID : '
      + scenarioId + ', What Id : ' + whatId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private getWhoObject(whoId: string, scenarioId: string): IActivityDetails {
    try {
      if (whoId === 'UserSelectedForEmptyRecord') {
        return this.emptyIActivityDetails;
      }
      return this.whoList[scenarioId].find(item => item.objectId === whoId);
    } catch (error) {
        this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get Who Object for Scenario ID : '
        + scenarioId + ', Who Id : ' + whoId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public setWhoEmptyRecord(scenarioId: string) {
    try {
      this.selectedWhoValueList[scenarioId] = 'UserSelectedForEmptyRecord';
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Who Empty Record for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public setWhatEmptyRecord(scenarioId: string) {
    try {
      this.selectedWhatValueList[scenarioId] = 'UserSelectedForEmptyRecord';
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set What Empty Record for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private whatListContains(whatObject: IActivityDetails, scenarioId: string): boolean {
    try {
      if (scenarioId) {
        const interactionWhatList = this.whatList[scenarioId];
        if (interactionWhatList) {
          return this.whatList[scenarioId].find(
            item => item.objectId === whatObject.objectId
          )
            ? true
            : false;
        }
      }
      return false;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Check if Exits in What List for Scenario ID : '
      + scenarioId + ', What Object : ' + JSON.stringify(whatObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private whoListContains(whoObject: IActivityDetails, scenarioId: string): boolean {
    try {
      if (scenarioId) {
        const interactionWhoList = this.whoList[scenarioId];
        if (interactionWhoList) {
          return this.whoList[scenarioId].find(item => item.objectId === whoObject.objectId) ? true : false;
        }
      }
      return false;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Check if Exits in Who List for Scenario ID : '
      + scenarioId + ', Who Object : ' + JSON.stringify(whoObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private setWhatList(activityDetails: IActivityDetails, scenarioId: string) {
    try {
      const interactionWhatList = this.whatList[scenarioId];
      if (!interactionWhatList) {
        this.whatList[scenarioId] = [];
      }
      this.whatList[scenarioId].push(activityDetails);
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set What List for Scenario ID : '
      + scenarioId + ', Activity Details : ' + JSON.stringify(activityDetails) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private setWhoList(activityDetails: IActivityDetails, scenarioId: string) {
    try {
      const interactionWhoList = this.whoList[scenarioId];
      if (!interactionWhoList) {
        this.whoList[scenarioId] = [];
      }
      this.whoList[scenarioId].push(activityDetails);
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Who List for Scenario ID : '
      + scenarioId + ', Activity Details : ' + JSON.stringify(activityDetails) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private clearWhatList(scenarioId: string) {
    try {
      delete this.whatList[scenarioId];
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Clear What List for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private clearWhoList(scenarioId: string) {
    try {
    delete this.whoList[scenarioId];
    this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Clear Who List for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public updateRecentWorkItem(recentWorkItem: Object, scenarioId: string, activityLayout: Object) {
    try {
      if ((!this.whoListContains(recentWorkItem['WhoObject'], scenarioId)) && (recentWorkItem['WhoObject'].objectId)) {
        this.setWhoList(recentWorkItem['WhoObject'], scenarioId);
      }
      this.selectedWhoValueList[scenarioId] = recentWorkItem['WhoObject'].objectId ? recentWorkItem['WhoObject'].objectId :
      'UserSelectedForEmptyRecord';
      if ((!this.whatListContains(recentWorkItem['WhatObject'], scenarioId)) && (recentWorkItem['WhatObject'].objectId)) {
        this.setWhatList(recentWorkItem['WhatObject'], scenarioId);
      }
      this.selectedWhatValueList[scenarioId] = recentWorkItem['WhatObject'].objectId ? recentWorkItem['WhatObject'].objectId :
      'UserSelectedForEmptyRecord';
      const activity = this.getActivity(scenarioId);
      const refFields: string[] = activityLayout[activity.ChannelType]['Fields'];
      const lookupFields: string[] = activityLayout[activity.ChannelType]['LookupFields'];
      for (let field of refFields) {
        if (lookupFields[field]) {
          field = lookupFields[field];
        }
        this.setActivityField(scenarioId, field, recentWorkItem[field]);
      }
      this.updateActivityFields(scenarioId);
      this.compareActivityFields(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update Recent Work Items for Scenario ID : '
      + scenarioId + ', Recent Work Item : ' + JSON.stringify(recentWorkItem) + ', Activity Layout : '
      + JSON.stringify(activityLayout)  + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public updateWhoWhatLists(activityObject: IActivityDetails, scenarioId: string) {
    try {
      if (activityObject.objectType === 'Contact' || activityObject.objectType === 'Lead') {
        if (!this.whoListContains(activityObject, scenarioId)) {
          this.setWhoList(activityObject, scenarioId);
        }
        if (this.activeScenarioIdList.indexOf(scenarioId) >= 0) {
          if (this.nameChangesList.indexOf(scenarioId) < 0) {
            this.selectedWhoValueList[scenarioId] = activityObject.objectId;
            this.setActivityWhoObject(activityObject, scenarioId);
            if (activityObject.objectType.toUpperCase() === 'LEAD') {
              this.selectedWhatValueList[scenarioId] = this.emptyIActivityDetails.objectId;
              this.setActivityWhatObject(this.emptyIActivityDetails, scenarioId);
            }
          }
        }
      } else {
        if (!this.whatListContains(activityObject, scenarioId)) {
          this.setWhatList(activityObject, scenarioId);
        }
        if (this.activeScenarioIdList.indexOf(scenarioId) >= 0) {
          if (this.relatedToChangesList.indexOf(scenarioId) < 0) {
            this.selectedWhatValueList[scenarioId] = activityObject.objectId;
            this.setActivityWhatObject(activityObject, scenarioId);
          }
        }
      }
      this.compareActivityFields(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update Who What Lists for Scenario ID : '
      + scenarioId + ', Activity Object : ' + JSON.stringify(activityObject)  + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public setsearchRecordList(searchRecords: api.IRecordItem[], scenarioId: string) {
    try {
      this.searchRecordList[scenarioId] = searchRecords;
      if (searchRecords.length > 1) {
        this.selectedSearchRecordList[scenarioId] = 'DefaultMultiMatch';
      }
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Set Search Record List for Scenario ID : '
      + scenarioId + ', Search Records : ' + JSON.stringify(searchRecords)  + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private clearSearchRecordList(scenarioId: string) {
    try {
      delete this.selectedSearchRecordList[scenarioId];
      delete this.searchRecordList[scenarioId];
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Clear Search Record List for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public updateActivityFields(scenarioId: string) {
    try {
      const activityFields = this.getActivityFields(scenarioId);
      if (!this.savedActivityFields) {
        this.savedActivityFields = {};
      }
      this.savedActivityFields[scenarioId] = activityFields;
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Update Activity Fields for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private getActivityFields(scenarioId: string): IActivityFields {
    try {
      const activityFields: IActivityFields = {
        whoId: this.selectedWhoValueList[scenarioId] ? this.selectedWhoValueList[scenarioId] :
        this.activityList[scenarioId].WhoObject.objectId,
        whatId: this.selectedWhatValueList[scenarioId] ? this.selectedWhatValueList[scenarioId] :
        this.activityList[scenarioId].WhatObject.objectId,
        subject: this.getActivity(scenarioId).Subject,
        description: this.getActivity(scenarioId).Description
      };
      return activityFields;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Get Activity Fields for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  public compareActivityFields(scenarioId: string) {
    try {
      const latestActivityData = this.getActivityFields(scenarioId);
      const keys = Object.keys(this.savedActivityFields[scenarioId]);
      for (const key in keys) {
        if (this.savedActivityFields[scenarioId][keys[key]] !== latestActivityData[keys[key]]) {
          this.activityList[scenarioId].IsUnSaved = true;
          this.storeToLocalStorage();
          return;
        }
      }
      this.activityList[scenarioId].IsUnSaved = false;
      this.storeToLocalStorage();
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Compare Activity Fields for Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
  }

  private storeToLocalStorage() {
    try {
      const prevScenarioRecord = localStorage.getItem('scenario');
      const scenarioRecord = JSON.stringify({
        activityList: this.activityList,
        currentScenarioId: this.currentScenarioId,
        searchRecordList: this.searchRecordList,
        whatList: this.whatList,
        whoList: this.whoList,
        recentScenarioIdList: this.recentScenarioIdList,
        activeScenarioIdList: this.activeScenarioIdList,
        expiredScenarioIdList: this.expiredScenarioIdList,
        lstRelatedToChanges: this.relatedToChangesList,
        lstNameChanges: this.nameChangesList,
        selectedWhatValueList: this.selectedWhatValueList,
        selectedWhoValueList: this.selectedWhoValueList,
        selectedSearchRecordList: this.selectedSearchRecordList,
        currentTicketId: this.currentTicketId,
        scenarioToCADMap: this.scenarioToCADMap,
        savedActivityFields: this.savedActivityFields,
      });
      this.loggerService.logger.logDebug('Salesforce - Storage : Storing to Local Storage. Scenario before update : ' + prevScenarioRecord);
      localStorage.setItem('scenario', scenarioRecord);
      this.loggerService.logger.logDebug('Salesforce - Storage : ERROR : Storing to Local Storage. Scenario after update : '
      + scenarioRecord);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Storing to Local Storage. Error Information : '
      + JSON.stringify(error));
    }
  }

  public syncWithLocalStorage() {
    try {
      const scenarioRecord = localStorage.getItem('scenario');
      this.loggerService.logger.logDebug('Salesforce - Storage : ERROR : Syncing with Local Storage. Scenario information : '
      + scenarioRecord);
      const browserStorage = JSON.parse(scenarioRecord);
      if (browserStorage) {
        this.activityList = browserStorage.activityList;
        this.currentScenarioId = browserStorage.currentScenarioId;
        this.searchRecordList = browserStorage.searchRecordList;
        this.whatList = browserStorage.whatList;
        this.whoList = browserStorage.whoList;
        this.recentScenarioIdList = browserStorage.recentScenarioIdList;
        this.activeScenarioIdList = browserStorage.activeScenarioIdList;
        this.expiredScenarioIdList = browserStorage.expiredScenarioIdList;
        this.relatedToChangesList = browserStorage.lstRelatedToChanges;
        this.nameChangesList = browserStorage.lstNameChanges;
        this.selectedWhatValueList = browserStorage.selectedWhatValueList;
        this.selectedWhoValueList = browserStorage.selectedWhoValueList;
        this.selectedSearchRecordList = browserStorage.selectedSearchRecordList;
        this.currentTicketId = browserStorage.currentTicketId;
        this.scenarioToCADMap = browserStorage.scenarioToCADMap;
        this.savedActivityFields = browserStorage.savedActivityFields;
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Syncing with Local Storage. Error Information : '
      + JSON.stringify(error));
    }
  }

  public onInteractionDisconnect(scenarioId: string) {
    try {
      this.loggerService.logger.logDebug('Salesforce - Storage : Received Interaction Disconnect Event for Scenario ID : ' + scenarioId);
      this.loggerService.logger.logDebug('Salesforce - Storage : Removing Activity for Scenario ID : ' + scenarioId);
      this.removeActivity(scenarioId);
      this.nameChangesList = this.nameChangesList.filter(item => item !== scenarioId);
      this.relatedToChangesList = this.relatedToChangesList.filter(item => item !== scenarioId);
      this.clearSearchRecordList(scenarioId);
      if (this.currentScenarioId === scenarioId) {
        if (this.activeScenarioIdList.length > 0) {
          this.setCurrentScenarioId(this.activeScenarioIdList[0]);
        } else {
          this.setCurrentScenarioId(null);
        }
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : On Interaction Disconnect. Error Information : '
      + JSON.stringify(error));
    }
  }

  public updateCadFields(interaction: IInteraction, cadActivityMap: Object) {
    try {
      const isInteractionCurrent = this.activityListContains(interaction.scenarioId);
      const isInteractionRecent = this.recentActivityListContains(interaction.scenarioId);
      if (interaction.details && interaction.details.fields && !this.scenarioToCADMap[this.currentScenarioId]) {
        this.scenarioToCADMap[interaction.scenarioId] = interaction.details.fields;
        this.storeToLocalStorage();
      }
      if (isInteractionCurrent || isInteractionRecent) {
        if (interaction.details) {
          for (const key in cadActivityMap) {
            if (interaction.details.fields[key] || interaction[key]) {
              const objActivity = this.getActivity(interaction.scenarioId);
              if (!objActivity.CadFields) {
                objActivity.CadFields = {};
              }
              objActivity.CadFields[cadActivityMap[key]] = interaction.details.fields[key] ? interaction.details.fields[key].Value :
              interaction[key];
              this.updateActivity(objActivity);
            }
          }
        }
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Storage : ERROR : Updating CAD Fields for Scenario ID : '
      + interaction.scenarioId + ', Interaction Details : ' + JSON.stringify(interaction) + ', CAD Activity Map : '
      + JSON.stringify(cadActivityMap) + '. Error information : ' + JSON.stringify(error));
    }
  }
}
