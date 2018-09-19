import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import * as channelApi from '@amc/channel-api/';
import { IActivity } from './../Model/IActivity';
import { IActivityDetails } from './../Model/IActivityDetails';
import { IParams } from './../Model/IParams';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  @Input() whoList: Array<IActivityDetails>;
  @Input() whatList: Array<IActivityDetails>;
  @Input() currentInteraction: api.IInteraction;
  @Input() ActivityMap: Map<string, IActivity>;
  @Input() interactionDisconnected: Subject<boolean>;
  @Input() autoSave: Subject<void>;
  @Input() subject: string;
  @Output() ActivitySave: EventEmitter<IActivity> = new EventEmitter<IActivity>();

  curWho: IActivityDetails;
  curWhat: IActivityDetails;
  callNotes: string;
  quickCommentList: Array<string>;

  constructor() {
    this.InitializeQuickComments();
    this.curWhat = null;
    this.curWho = null;
    this.subject = '';
    this. callNotes = 'Click to add a comment';
    this.ActivityMap = new Map();
  }

  ngOnInit() {
    this.interactionDisconnected.subscribe(event => {
      this.activitySave(true);
    });
    this.autoSave.subscribe(event => {
      this.activitySave(false);
    });
  }

  setSelectedInteraction(interactionList) {
    console.log('interaction ' + interactionList.srcElement[0].id );
   // this.selectedInteraction = this.getInteraction(interactionList.srcElement[0].id);
  }

  protected activitySave(clear_activity_fields) {
    if (this.currentInteraction) {
    let activity = this.ActivityMap.get(this.currentInteraction.interactionId);
    activity.CallDurationInSeconds = this.getSecondsElapsed(activity.TimeStamp).toString();

    if (this.curWhat === null) {
      if (this.whatList.length !== 0) {
        activity.WhatObject = this.whatList[0];
      }
    } else {
      activity.WhatObject = this.curWhat;
    }
    if (this.curWho === null) {
      if (this.whoList.length !== 0 ) {
        activity.WhoObject = this.whoList[0];
      }
    } else {
      activity.WhoObject = this.curWho;
    }
    if (this.callNotes !== 'Click to add a comment') {
      activity.Description = this.callNotes;
    } else {
      activity.Description = '';
    }
    activity.CallType = this.getInteractionDirection(this.currentInteraction.direction);
    activity.Subject = this.subject;
    if (clear_activity_fields) {
      activity.Status = 'Completed';
      this.clearActivityDetails();
      this.ActivitySave.emit(activity);
    } else {
      this.ActivitySave.emit(activity);
    }
  }
  }
  protected clearActivityDetails() {
    this.subject = null;
    this.callNotes = null;
  }
  protected onNameSelectChange(event) {
    this.curWho = this.getWho(event.currentTarget.value);
    this.activitySave(false);
  }
  protected onRelatedToChange(event) {
    this. curWhat = this.getWhat(event.currentTarget.value);
    this.activitySave(false);
  }
  protected onSubjectChange(event) {
    this.subject = event.srcElement.value;
    this.activitySave(false);
  }
  protected onCallNotesChange(event) {
    this.callNotes = event.srcElement.value.trim();
    this.activitySave(false);
  }
  protected removeDefaultCallNote() {
    if (this.callNotes === 'Click to add a comment') {
      this.callNotes = '';
    }
  }
  protected getInteractionDirection(directionNumber) {
    if (directionNumber === 0 ) {
      return 'Inbound';
    } else if (directionNumber === 1) {
      return 'Outbound';
    }
    return 'Internal';
  }
  protected getSecondsElapsed(startDate): number {
    const EndDate = new Date();
    return Math.round((EndDate.getTime() - startDate.getTime()) / 1000);
  }

  protected getWho(id): IActivityDetails {
    for (let i = 0; i < this.whoList.length; i++) {
      if (this.whoList[i].objectId === id) {
        return this.whoList[i];
      }
    }
  }
  protected getWhat(id): IActivityDetails {
    for (let i = 0; i < this.whatList.length; i++) {
      if (this.whatList[i].objectId === id) {
        return this.whatList[i];
      }
    }
  }

  protected InitializeQuickComments() {
    this.quickCommentList = [];
    this.quickCommentList.push('Left voicemail: ');
    this.quickCommentList.push('Scheduled follow up: ');
    this.quickCommentList.push('Transferred to: ');
    this.quickCommentList.push('Sent email ');
    this.quickCommentList.push('Number of agents: ');
    this.quickCommentList.push('Selling points: ');
  }

  protected loadQuickComment(value) {
    this.callNotes = this.quickCommentList[value];
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    return whoObject.objectType + ': ' + whoObject.objectName;
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    return whatObject.objectType + ': ' + whatObject.objectName;
  }
  }
