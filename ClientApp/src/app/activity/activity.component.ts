import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { IActivity } from './../Model/IActivity';
import { IActivityDetails } from './../Model/IActivityDetails';
import { ICreateNewParams } from './../Model/ICreateNewParams';
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
  @Input() subject: string;
  @Output() ActivitySave: EventEmitter<IActivity> = new EventEmitter<IActivity>();
  @Output() childComponentLogger: EventEmitter<string> = new EventEmitter<string>();

  maximizeActivity: boolean;
  currentWhoObject: IActivityDetails;
  currentWhatObject: IActivityDetails;
  currentCallNotes: string;
  quickCommentList: string[];

  constructor(private loggerService: LoggerService) {
    this.loggerService.logger.logDebug('activity: Constructor start');
    this.quickCommentList = ['Left voicemail: ',
      'Scheduled follow up: ', 'Transferred to: ',
      'Sent email ', 'Number of agents: ',
      'Selling points: '];
    this.currentWhatObject = null;
    this.currentWhoObject = null;
    this.subject = '';
    this.currentCallNotes = '';
    this.ActivityMap = new Map();
    this.maximizeActivity = true;
    this.loggerService.logger.logDebug('activity: Constructor complete');
  }
  ngOnInit() {
    this.interactionDisconnected.subscribe(event => {
      this.loggerService.logger.logDebug('create: Interaction disconnected event received');
      this.activitySave(true);
    });
    this.autoSave.subscribe(event => {
      this.loggerService.logger.logDebug('create: Auto save event received');
      this.activitySave(false);
    });
  }
  protected resizeActivity(size) {
    if (size === 'collapse') {
      this.loggerService.logger.logDebug('activity: collapse window');
      this.maximizeActivity = false;
    } else {
      this.loggerService.logger.logDebug('activity: expand window');
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
      activity.Subject = this.subject;
      if (clearActivityFields) {
        activity.Status = 'Completed';
        this.subject = null;
        this.currentCallNotes = null;
        this.ActivitySave.emit(activity);
      } else {
        this.ActivitySave.emit(activity);
      }
      this.loggerService.logger.logDebug('activity: Save activity: ' + JSON.stringify(activity));
    }
  }
  protected onNameSelectChange(event) {
    this.currentWhoObject = this.getWho(event.currentTarget.value);
    this.loggerService.logger.logDebug('activity: Call from select box value changed: ' + JSON.stringify(this.currentWhoObject));
    this.activitySave(false);
  }
  protected onRelatedToChange(event) {
    this.currentWhatObject = this.getWhat(event.currentTarget.value);
    this.loggerService.logger.logDebug('activity: Related to select box value changed: ' + JSON.stringify(this.currentWhatObject));
    this.activitySave(false);
  }
  protected onSubjectChange(event) {
    this.subject = event.srcElement.value;
    this.loggerService.logger.logDebug('activity: Subject value changed: ' + JSON.stringify(this.subject));
    this.activitySave(false);
  }
  protected onCallNotesChange(event) {
    this.currentCallNotes = event.srcElement.value.trim();
    this.loggerService.logger.logDebug('activity: Call notes value changed: ' + JSON.stringify(this.currentCallNotes));
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
