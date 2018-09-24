import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { IActivity } from './../Model/IActivity';
import { IActivityDetails } from './../Model/IActivityDetails';
import { IParams } from './../Model/IParams';
import { LoggerService } from './../logger.service';
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
  @Input() currentWhatObjectcurrentSubject: string;
  @Output() ActivitySave: EventEmitter<IActivity> = new EventEmitter<IActivity>();
  maximizeActivity: boolean;
  currentWhoObject: IActivityDetails;
  currentWhatObject: IActivityDetails;
  currentCallNotes: string;
  quickCommentList: String[];

  constructor(private loggerService: LoggerService) {
    this.InitializeQuickComments();
    this.currentWhatObject = null;
    this.currentWhoObject = null;
    this.currentWhatObjectcurrentSubject = '';
    this.currentCallNotes = '';
    this.ActivityMap = new Map();
    this.maximizeActivity = true;
  }

  ngOnInit() {
    this.interactionDisconnected.subscribe(event => {
      this.activitySave(true);
    });
    this.autoSave.subscribe(event => {
      this.activitySave(false);
    });
  }
  protected resizeActivity(size) {
    if (size === 'collapse') {
      this.maximizeActivity = false;
    } else {
      this.maximizeActivity = true;
    }
  }
  protected activitySave(clearActivityFields) {
    if (this.currentInteraction) {
      const activity = this.ActivityMap.get(this.currentInteraction.interactionId);
      activity.CallDurationInSeconds = this.getSecondsElapsed(activity.TimeStamp).toString();

      if (this.currentWhatObject === null) {
        if (this.whatList.length !== 0) {
          activity.WhatObject = this.whatList[0];
        }
      } else {
        activity.WhatObject = this.currentWhatObject;
      }
      if (this.currentWhoObject === null) {
        if (this.whoList.length !== 0) {
          activity.WhoObject = this.whoList[0];
        }
      } else {
        activity.WhoObject = this.currentWhoObject;
      }
      activity.Description = this.currentCallNotes;
      activity.CallType = this.getInteractionDirection(this.currentInteraction.direction);
      activity.Subject = this.currentWhatObjectcurrentSubject;
      if (clearActivityFields) {
        activity.Status = 'Completed';
        this.clearActivityDetails();
        this.ActivitySave.emit(activity);
      } else {
        this.ActivitySave.emit(activity);
      }
    }
  }
  protected clearActivityDetails() {
    this.currentWhatObjectcurrentSubject = null;
    this.currentCallNotes = null;
  }
  protected onNameSelectChange(event) {
    this.currentWhoObject = this.getWho(event.currentTarget.value);
    this.activitySave(false);
  }
  protected onRelatedToChange(event) {
    this.currentWhatObject = this.getWhat(event.currentTarget.value);
    this.activitySave(false);
  }
  protected onSubjectChange(event) {
    this.currentWhatObjectcurrentSubject = event.srcElement.value;
    this.activitySave(false);
  }
  protected onCallNotesChange(event) {
    this.currentCallNotes = event.srcElement.value.trim();
    this.activitySave(false);
  }
  protected getInteractionDirection(directionNumber) {
    if (directionNumber === 0) {
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
    this.quickCommentList.push('Call Back: ');
    this.quickCommentList.push('Do not disturb: ');
    this.quickCommentList.push('Requires more information: ');
    this.quickCommentList.push('Escalation: ');

  }

  protected loadQuickComment(value) {
    this.currentCallNotes = this.quickCommentList[value];
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    return whoObject.objectType + ': ' + whoObject.objectName;
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    return whatObject.objectType + ': ' + whatObject.objectName;
  }
}
