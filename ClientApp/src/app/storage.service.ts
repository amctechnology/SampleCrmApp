import * as api from '@amc-technology/davinci-api';
import { IInteraction } from '@amc-technology/davinci-api';
import { IActivity } from './Model/IActivity';
import { IActivityDetails } from './Model/IActivityDetails';
import { Injectable } from '@angular/core';
@Injectable()
export class StorageService {
  public whoList: IActivityDetails[];
  public whatList: IActivityDetails[];
  public currentInteraction: api.IInteraction;
  public activityList: IActivity[];
  public recentActivityList: IActivity[];
  public activity: IActivity;
  public searchRecordList: api.IRecordItem[];
  public searchReturnedSingleResult: boolean;
  public searchResultWasReturned: boolean;
  public currentTicketId: string;
  public maxRecentItems: Number;
  public selectedSearchRecord: string;
  constructor() {
    this.activityList = [];
    this.recentActivityList = [];
    this.currentInteraction = null;
    this.searchRecordList = [];
    this.searchResultWasReturned = null;
    this.searchReturnedSingleResult = null;
    this.whatList = [];
    this.whoList = [];
    this.currentTicketId = '';
    this.maxRecentItems = 0;
  }
  public setCurrentTicketId(id) {
    this.currentTicketId = id;
    this.storeToLocalStorage();
  }
  public getCurrentTicketId() {
    return this.currentTicketId;
  }
  public getActivity(interactionId: string): IActivity {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        return this.activityList[i];
      }
    }
  }
  public addActivity(activity: IActivity) {
    this.activityList.push(activity);
    this.activity = activity;
    this.storeToLocalStorage();
  }
  public updateActivity(activity: IActivity) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === activity.InteractionId) {
        this.activityList[i] = activity;
        this.activity = activity;
        this.storeToLocalStorage();
      }
    }
  }
  public activityListContains(interactionId: string): boolean {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        return true;
      }
    }
    return false;
  }
  public removeActivity(interactionId: string) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        this.addRecentActivity(this.activityList[i]);
        this.activityList.splice(i, 1);
        this.activity = null;
      }
      this.storeToLocalStorage();
    }
  }
  public getSubject(interactionId: string): string {
    return this.getActivity(interactionId).Subject;
  }
  public setSubject(interactionId: string, subject: string) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        this.activityList[i].Subject = subject;
        this.activity = this.activityList[i];
        this.storeToLocalStorage();
        break;
      }
    }
  }
  public getDescription(interactionId: string): string {
    return this.getActivity(interactionId).Description;
  }
  public setDescription(interactionId: string, description: string) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        this.activityList[i].Description = description;
        this.activity = this.activityList[i];
        this.storeToLocalStorage();
        break;
      }
    }
  }
  public setActivityWhoObject(interactionId: string, whoObject: IActivityDetails) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        this.activityList[i].WhoObject = whoObject;
        this.activity = this.activityList[i];
        this.storeToLocalStorage();
        break;
      }
    }
  }
  public setActivityWhatObject(interactionId: string, whatObject: IActivityDetails) {
    for (let i = 0; i < this.activityList.length; i++) {
      if (this.activityList[i].InteractionId === interactionId) {
        this.activityList[i].WhatObject = whatObject;
        this.activity = this.activityList[i];
        this.storeToLocalStorage();
        break;
      }
    }
  }
  public clearActivity() {
    this.activity = null;
  }
  public getSearchResultWasReturned(): boolean {
    return this.searchResultWasReturned;
  }
  public setSearchResultWasReturned(searchResultWasReturned: boolean) {
    this.searchResultWasReturned = searchResultWasReturned;
    this.storeToLocalStorage();
  }
  public getSearchReturnedSingleResult(): boolean {
    return this.searchReturnedSingleResult;
  }
  public setSearchReturnedSingleResult(searchReturnedSingleResult: boolean) {
    this.searchReturnedSingleResult = searchReturnedSingleResult;
    this.storeToLocalStorage();
  }
  public getCurrentInteraction(): IInteraction {
    return this.currentInteraction;
  }
  public setCurrentInteraction(currentInteraction: IInteraction) {
    this.currentInteraction = currentInteraction;
  }
  public whatListContains(whatObject: IActivityDetails): boolean {
    for (let i = 0; i < this.whatList.length; i++) {
      if (this.whatList[i] && (this.whatList[i].objectId === whatObject.objectId)) {
        return true;
      }
    }
    return false;
  }
  public getWhoList(): IActivityDetails[] {
    return this.whoList;
  }
  public setWhoList(activityDetails: IActivityDetails) {
    this.whoList.push(activityDetails);
    this.storeToLocalStorage();
  }
  public clearWhoList() {
    this.whoList = [];
    this.storeToLocalStorage();
  }
  public getWhatList(): IActivityDetails[] {
    return this.whatList;
  }
  public setWhatList(activityDetails: IActivityDetails) {
    this.whatList.push(activityDetails);
    this.storeToLocalStorage();
  }
  public clearWhatList() {
    this.whatList = [];
    this.storeToLocalStorage();
  }
  public getsearchRecordList(): api.IRecordItem[] {
    return this.searchRecordList;
  }
  public getSearchRecord(id) {
    for (let i = 0; i < this.searchRecordList.length; i++) {
      if (this.searchRecordList[i].id === id) {
        return this.searchRecordList[i];
      }
    }
  }
  public setsearchRecordList(searchRecords: api.IRecordItem[]) {
    this.searchRecordList = searchRecords;
    this.storeToLocalStorage();
  }
  public clearSearchRecordList() {
    this.searchRecordList = [];
    this.storeToLocalStorage();
  }
  public whoListContains(whoObject) {
    for (let i = 0; i < this.whoList.length; i++) {
      if (this.whoList[i] && (this.whoList[i].objectId === whoObject.objectId)) {
        return true;
      }
    }
    return false;
  }
  public clearDescription() {
    this.activity.Description = '';
    this.storeToLocalStorage();
  }
  public onInteractionDisconnect() {
    this.setCurrentInteraction(null);
    this.clearSearchRecordList();
    this.clearActivity();
    this.setSearchResultWasReturned(false);
    this.clearWhatList();
    this.clearWhoList();
  }
  public storeToLocalStorage() {
    localStorage.setItem('scenario', JSON.stringify({
      activityList: this.activityList,
      activity: this.activity,
      currentInteraction: this.currentInteraction,
      searchRecordList: this.searchRecordList,
      searchResultWasReturned: this.searchResultWasReturned,
      searchReturnedSingleResult: this.searchReturnedSingleResult,
      whatList: this.whatList,
      whoList: this.whoList,
      currentTicketId: this.currentTicketId,
      recentActivityList: this.recentActivityList,
      selectedSearchRecord: this.selectedSearchRecord
    }));
  }
  public syncWithLocalStorage() {
    const browserStorage = JSON.parse(localStorage.getItem('scenario'));
    if (browserStorage) {
      this.activityList = browserStorage.activityList;
      this.activity = browserStorage.activity,
        this.currentInteraction = browserStorage.currentInteraction;
      this.searchRecordList = browserStorage.searchRecordList;
      this.searchResultWasReturned = browserStorage.searchResultWasReturned;
      this.searchReturnedSingleResult = browserStorage.searchReturnedSingleResult;
      this.whatList = browserStorage.whatList;
      this.whoList = browserStorage.whoList;
      this.currentTicketId = browserStorage.currentTicketId;
      this.recentActivityList = browserStorage.recentActivityList;
      this.selectedSearchRecord = browserStorage.selectedSearchRecord;
    }
  }
  public recentActivityListContains(interactionId: string): boolean {
    return (this.recentActivityList.find(item => item.InteractionId === interactionId)) ? true : false;
  }
  public addRecentActivity(activity: IActivity) {
    if (this.recentActivityList.length === this.maxRecentItems) {
      this.recentActivityList.pop();
    }
    this.recentActivityList.unshift(activity);
    this.storeToLocalStorage();
  }
  public updateRecentActivity(activity: IActivity) {
    for (let i = 0; i < this.recentActivityList.length; i++) {
      if (this.recentActivityList[i].InteractionId === activity.InteractionId) {
        this.recentActivityList[i] = activity;
        this.storeToLocalStorage();
      }
    }
  }
  public getRecentActivity(interactionId: string): IActivity {
    return (this.recentActivityList.find(item => item.InteractionId === interactionId));
  }
  public updateCadFields(interaction: IInteraction, cadActivityMap: any) {
    const isInteractionCurrent = this.activityListContains(interaction.interactionId);
    const isInteractionRecent = this.recentActivityListContains(interaction.interactionId);
    if (isInteractionCurrent || isInteractionRecent) {
        if (interaction.details) {
          for (const key in cadActivityMap) {
            if (interaction.details.fields[key]) {
              const objActivity = (isInteractionCurrent) ?
              this.getActivity(interaction.interactionId) :
              this.getRecentActivity(interaction.interactionId);
              if (!objActivity.CadFields) {
                objActivity.CadFields = {};
              }
              objActivity.CadFields[cadActivityMap[key]] = interaction.details.fields[key].Value;
              if (isInteractionCurrent) {
                this.updateActivity(objActivity);
              } else {
                this.updateRecentActivity(objActivity);
              }
            }
          }
      }
    }
  }
}
