import * as api from '@amc/application-api';
import { InteractionDirectionTypes, IInteraction } from '@amc/application-api';
import { Subject } from 'rxjs/Subject';
import { IActivity } from './Model/IActivity';
import { IActivityDetails } from './Model/IActivityDetails';
export class StorageService {
  public whoList: IActivityDetails[];
  public whatList: IActivityDetails[];
  public currentInteraction: api.IInteraction;
  public activityList: IActivity[];
  public activity: IActivity;
  public searchRecordList: api.IRecordItem[];
  public searchReturnedSingleResult: boolean;
  public searchResultWasReturned: boolean;
  constructor() {
    this.activityList = [];
    this.currentInteraction = null;
    this.searchRecordList = [];
    this.searchResultWasReturned = null;
    this.searchReturnedSingleResult = null;
    this.whatList = [];
    this.whoList = [];
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
      if (this.whatList[i].objectId === whatObject.objectId) {
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
      if (this.whoList[i].objectId === whoObject.objectId) {
        return true;
      }
    }
    return false;
  }
  protected storeToLocalStorage() {
    localStorage.setItem('scenario', JSON.stringify({
      activityList: this.activityList,
      activity: this.activity,
      currentInteraction: this.currentInteraction,
      searchRecordList: this.searchRecordList,
      searchResultWasReturned: this.searchResultWasReturned,
      searchReturnedSingleResult: this.searchReturnedSingleResult,
      whatList: this.whatList,
      whoList: this.whoList
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
    }
  }
}
