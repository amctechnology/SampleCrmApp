import * as api from '@amc-technology/davinci-api';
import { IInteraction } from '@amc-technology/davinci-api';
import { IActivity } from './Model/IActivity';
import { IActivityDetails } from './Model/IActivityDetails';
import { Injectable } from '@angular/core';
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

  constructor() {
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
  }

  public getCurrentScenarioId(): string {
    return this.currentScenarioId;
  }

  public setCurrentScenarioId(currentScenarioId: string) {
    this.currentScenarioId = currentScenarioId;
    this.storeToLocalStorage();
  }

  public setCurrentTicketId(id) {
    this.currentTicketId = id;
    this.storeToLocalStorage();
  }

  public getCurrentTicketId() {
    return this.currentTicketId;
  }

  public getActivity(scenarioId: string = null): IActivity {
    if (!scenarioId) {
      scenarioId = this.currentScenarioId;
    }
    if (this.activityList[scenarioId]) {
      return this.activityList[scenarioId];
    }
    return null;
  }

  public recentActivityListContains(scenarioId: string): boolean {
    return this.activityList[scenarioId] &&
      !this.activityList[scenarioId].IsActive
      ? true
      : false;
  }

  private addRecentActivity(activity: IActivity) {
    const deleteExpiredActivity =
      this.expiredScenarioIdList.length === this.maxExpiredItems &&
      this.maxRecentItems === 0;
    if (
      Object.keys(this.recentScenarioIdList).length === this.maxRecentItems ||
      this.maxRecentItems === 0
    ) {
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
        delete this.activityList[scenarioId];
      }
    }
    if (this.maxRecentItems !== 0) {
      this.recentScenarioIdList.unshift(activity.ScenarioId);
    } else {
      this.expiredScenarioIdList.unshift(activity.ScenarioId);
    }
    this.storeToLocalStorage();
  }

  public addActivity(activity: IActivity) {
    this.activityList[activity.ScenarioId] = activity;
    this.activeScenarioIdList.push(activity.ScenarioId);
    this.storeToLocalStorage();
  }

  public updateActivity(activity: IActivity) {
    if (this.activityList[activity.ScenarioId]) {
      this.activityList[activity.ScenarioId] = activity;
    }
    this.storeToLocalStorage();
  }

  private removeActivity(scenarioId: string) {
    if (this.activityList[scenarioId]) {
      this.addRecentActivity(this.activityList[scenarioId]);
      this.activeScenarioIdList = this.activeScenarioIdList.filter(
        id => id !== scenarioId
      );
    }
    this.storeToLocalStorage();
  }

  private activityListContains(scenarioId: string): boolean {
    return this.activityList[scenarioId] ? true : false;
  }

  public getSubject(): string {
    return this.getActivity().Subject;
  }

  public setSubject(subject: string, scenarioId: string) {
    if (this.activityList[scenarioId]) {
      this.activityList[scenarioId].Subject = subject;
    }
    this.storeToLocalStorage();
  }

  public getDescription(): string {
    return this.getActivity().Description;
  }

  public setDescription(description: string, scenarioId: string) {
    if (this.activityList[scenarioId]) {
      this.activityList[scenarioId].Description = description;
    }
    this.storeToLocalStorage();
  }

  private setActivityWhoObject(
    whoObject: IActivityDetails,
    scenarioId: string
  ) {
    if (this.activityList[scenarioId]) {
      this.activityList[scenarioId].WhoObject = whoObject;
    }
    this.storeToLocalStorage();
  }

  private setActivityWhatObject(
    whatObject: IActivityDetails,
    scenarioId: string
  ) {
    if (this.activityList[scenarioId]) {
      this.activityList[scenarioId].WhatObject = whatObject;
    }
    this.storeToLocalStorage();
  }

  public UpdateWhoObjectSelectionChange(
    whoObjectId: string,
    scenarioId: string
  ) {
    const currentWhoObject = this.getWhoObject(whoObjectId, scenarioId);
    if (this.currentScenarioId === scenarioId) {
      this.nameChangesList.push(scenarioId);
    }
    if (currentWhoObject.objectType.toUpperCase() === 'LEAD') {
      this.selectedWhatValueList[scenarioId] = this.emptyIActivityDetails.objectId;
      this.setActivityWhatObject(this.emptyIActivityDetails, scenarioId);
    }
    this.setActivityWhoObject(currentWhoObject, scenarioId);
  }

  public UpdateWhatObjectSelectionChange(
    whatObjectId: string,
    scenarioId: string
  ) {
    const currentWhatObject = this.getWhatObject(whatObjectId, scenarioId);
    if (this.currentScenarioId === scenarioId) {
      this.relatedToChangesList.push(scenarioId);
    }
    this.setActivityWhatObject(currentWhatObject, scenarioId);
  }

  private getWhatObject(whatId: string, scenarioId: string): IActivityDetails {
    if (whatId === 'UserSelectedForEmptyRecord') {
      return this.emptyIActivityDetails;
    }
    return this.whatList[scenarioId].find(item => item.objectId === whatId);
  }

  private getWhoObject(whoId: string, scenarioId: string): IActivityDetails {
    if (whoId === 'UserSelectedForEmptyRecord') {
      return this.emptyIActivityDetails;
    }
    return this.whoList[scenarioId].find(item => item.objectId === whoId);
  }

  private whatListContains(
    whatObject: IActivityDetails,
    scenarioId: string
  ): boolean {
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
  }

  private whoListContains(
    whoObject: IActivityDetails,
    scenarioId: string
  ): boolean {
    if (scenarioId) {
      const interactionWhoList = this.whoList[scenarioId];
      if (interactionWhoList) {
        return this.whoList[scenarioId].find(
          item => item.objectId === whoObject.objectId
        )
          ? true
          : false;
      }
    }
    return false;
  }

  public setWhatList(activityDetails: IActivityDetails, scenarioId: string) {
    const interactionWhatList = this.whatList[scenarioId];
    if (!interactionWhatList) {
      this.whatList[scenarioId] = [];
    }
    this.whatList[scenarioId].push(activityDetails);
    this.storeToLocalStorage();
  }

  public setWhoList(activityDetails: IActivityDetails, scenarioId: string) {
    const interactionWhoList = this.whoList[scenarioId];
    if (!interactionWhoList) {
      this.whoList[scenarioId] = [];
    }
    this.whoList[scenarioId].push(activityDetails);
    this.storeToLocalStorage();
  }

  private clearWhatList(scenarioId: string) {
    delete this.whatList[scenarioId];
    this.storeToLocalStorage();
  }

  private clearWhoList(scenarioId: string) {
    delete this.whoList[scenarioId];
    this.storeToLocalStorage();
  }

  public updateWhoWhatLists(
    activityObject: IActivityDetails,
    scenarioId: string
  ) {
    if (
      activityObject.objectType === 'Contact' ||
      activityObject.objectType === 'Lead'
    ) {
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
  }

  public setsearchRecordList(
    searchRecords: api.IRecordItem[],
    scenarioId: string
  ) {
    this.searchRecordList[scenarioId] = searchRecords;
    if (searchRecords.length > 1) {
      this.selectedSearchRecordList[scenarioId] = 'DefaultMultiMatch';
    }
    this.storeToLocalStorage();
  }

  public clearSearchRecordList(scenarioId: string) {
    delete this.selectedSearchRecordList[scenarioId];
    delete this.searchRecordList[scenarioId];
    this.storeToLocalStorage();
  }

  public storeToLocalStorage() {
    localStorage.setItem(
      'scenario',
      JSON.stringify({
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
        scenarioToCADMap: this.scenarioToCADMap
      })
    );
  }

  public syncWithLocalStorage() {
    const browserStorage = JSON.parse(localStorage.getItem('scenario'));
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
    }
  }

  public onInteractionDisconnect(scenarioId: string) {
    this.removeActivity(scenarioId);
    this.nameChangesList = this.nameChangesList.filter(
      item => item !== scenarioId
    );
    this.relatedToChangesList = this.relatedToChangesList.filter(
      item => item !== scenarioId
    );
    this.clearSearchRecordList(scenarioId);
    if (this.currentScenarioId === scenarioId) {
      if (this.activeScenarioIdList.length > 0) {
        this.setCurrentScenarioId(this.activeScenarioIdList[0]);
      } else {
        this.setCurrentScenarioId(null);
      }
    }
  }

  public updateCadFields(interaction: IInteraction, cadActivityMap: Object) {
    const isInteractionCurrent = this.activityListContains(
      interaction.scenarioId
    );
    const isInteractionRecent = this.recentActivityListContains(
      interaction.scenarioId
    );
    if (
      interaction.details &&
      interaction.details.fields &&
      !this.scenarioToCADMap[this.currentScenarioId]
    ) {
      this.scenarioToCADMap[interaction.scenarioId] =
        interaction.details.fields;
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
            objActivity.CadFields[cadActivityMap[key]] = interaction.details
              .fields[key]
              ? interaction.details.fields[key].Value
              : interaction[key];
            this.updateActivity(objActivity);
          }
        }
      }
    }
  }
}
