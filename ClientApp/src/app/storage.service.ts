import * as api from '@amc/application-api';
import { InteractionDirectionTypes, IInteraction } from '@amc/application-api';
import { Subject } from 'rxjs/Subject';
import { IActivity } from './Model/IActivity';
import { IActivityDetails } from './Model/IActivityDetails';
export class StorageService {
  private whoList: IActivityDetails[];
  private whatList: IActivityDetails[];
  private subject: string;
  private currentInteraction: api.IInteraction;
  private ActivityMap: Map<string, IActivity>;
  private searchRecordList: api.IRecordItem[];
  private searchReturnedSingleResult: boolean;
  private searchResultWasReturned: boolean;
  constructor() {
    this.ActivityMap = new Map();
    this.currentInteraction = null;
    this.searchRecordList = [];
    this.searchResultWasReturned = null;
    this.searchReturnedSingleResult = null;
    this.subject = null;
    this.whatList = [];
    this.whoList = [];
  }
  public getActivity(interactionId: string): IActivity {
    return this.ActivityMap.get(interactionId);
  }
  public setActivityMap(interactionId: string, activity: IActivity) {
    this.ActivityMap.set(interactionId, activity);
  }
  public ActivityMapContains(interactionId: string): boolean {
    return this.ActivityMap.has(interactionId);
  }
  public removeActivity(interactionId: string) {
    delete this.ActivityMap[interactionId];
  }
  public getSubject(): string {
    return this.subject;
  }
  public setSubject(subject: string) {
    this.subject = subject;
  }
  public getSearchResultWasReturned(): boolean {
    return this.searchResultWasReturned;
  }
  public setSearchResultWasReturned(searchResultWasReturned: boolean) {
    this.searchResultWasReturned = searchResultWasReturned;
  }
  public getSearchReturnedSingleResult(): boolean {
    return this.searchReturnedSingleResult;
  }
  public setSearchReturnedSingleResult(searchReturnedSingleResult: boolean) {
    this.searchReturnedSingleResult = searchReturnedSingleResult;
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
  }
  public clearWhoList() {
    this.whoList = [];
  }
  public getWhatList(): IActivityDetails[] {
    return this.whatList;
  }
  public setWhatList(activityDetails: IActivityDetails) {
    this.whatList.push(activityDetails);
  }
  public clearWhatList() {
    this.whatList = [];
  }
  public getsearchRecordList(): api.IRecordItem[] {
    return this.searchRecordList;
  }
  public setsearchRecordList(searchRecords: api.IRecordItem[]) {
    this.searchRecordList.push(searchRecords);
  }
  public clearSearchRecordList() {
    this.searchRecordList = [];
  }
  public whoListContains(whoObject) {
    for (let i = 0; i < this.whoList.length; i++) {
      if (this.whoList[i].objectId === whoObject.objectId) {
        return true;
      }
    }
    return false;
  }
}
