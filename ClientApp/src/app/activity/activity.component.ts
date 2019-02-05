import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { Subject } from 'rxjs/Subject';
import { IActivity } from './../Model/IActivity';
import { IActivityDetails } from './../Model/IActivityDetails';
import { LoggerService } from './../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {
  @Input() interactionDisconnected: Subject<boolean>;
  @Input() autoSave: Subject<void>;
  @Input() quickCommentList: string[];
  @Output() ActivitySave: EventEmitter<IActivity> = new EventEmitter<IActivity>();
  @Output() childComponentLogger: EventEmitter<string> = new EventEmitter<string>();

  isActivityMaximized: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('activity: Constructor start');
    this.isActivityMaximized = true;
    this.loggerService.logger.logDebug('activity: Constructor complete');
  }
  ngOnInit() {
    this.interactionDisconnected.subscribe(() => {
      this.loggerService.logger.logDebug('create: Interaction disconnected event received', api.ErrorCode.DISCONEECTED_INTERACTION);
      this.activitySave(true);
    });
    this.autoSave.subscribe(() => {
      this.loggerService.logger.logDebug('create: Auto save event received');
      this.activitySave(false);
    });
  }
  protected activitySave(clearActivityFields) {
    if (this.storageService.currentInteraction) {
      this.storageService.activity.CallDurationInSeconds = this.getSecondsElapsed(this.storageService.activity.TimeStamp).toString();
      if (this.storageService.activity.WhatObject.objectType === '') {
        if (this.storageService.whatList.length !== 0) {
          this.storageService.activity.WhatObject = this.storageService.whatList[0];
        }
      }
      if (this.storageService.activity.WhoObject.objectType === '') {
        if (this.storageService.whoList.length !== 0) {
          this.storageService.activity.WhoObject = this.storageService.whoList[0];
        }
      }
      this.storageService.activity.CallType = this.getInteractionDirection(this.storageService.getCurrentInteraction().direction);
      if (clearActivityFields) {
        this.storageService.activity.Status = 'Completed';
        this.ActivitySave.emit(this.storageService.activity);
      } else {
        this.ActivitySave.emit(this.storageService.activity);
      }
      this.loggerService.logger.logDebug(`activity: Save activity: ${JSON.stringify(this.storageService.activity)}`
        , api.ErrorCode.ACTIVITY);
    }
  }
  protected onNameSelectChange(event) {
    this.storageService.setActivityWhoObject(this.storageService.currentInteraction.interactionId, this.getWho(event.currentTarget.value));
    this.loggerService.logger.logDebug(`activity: Call from select box value changed: ${JSON.stringify(event.currentTarget.value)}`
      , api.ErrorCode.ACTIVITY);
    this.activitySave(false);
  }
  protected onRelatedToChange(event) {
    this.storageService.setActivityWhatObject(this.storageService.currentInteraction.interactionId,
      this.getWhat(event.currentTarget.value));
    this.loggerService.logger.logDebug(`activity: Related to select box value changed: ${JSON.stringify(event.currentTarget.value)}`
      , api.ErrorCode.ACTIVITY);
    this.activitySave(false);
  }
  protected onSubjectChange(event) {
    this.storageService.setSubject(this.storageService.currentInteraction.interactionId, event.srcElement.value);
    this.loggerService.logger.logDebug(`activity: Subject value changed: ${JSON.stringify(this.storageService.activity.Subject)}`
      , api.ErrorCode.ACTIVITY);
    this.activitySave(false);
  }
  protected onCallNotesChange(event) {
    this.storageService.setDescription(this.storageService.currentInteraction.interactionId, event.srcElement.value.trim());
    this.loggerService.logger.logDebug(`activity: Call notes value changed: ${JSON.stringify(this.storageService.activity.Description)}`
      , api.ErrorCode.ACTIVITY);
    this.activitySave(false);
  }
  protected getInteractionDirection(directionNumber) {
    if (directionNumber === api.InteractionDirectionTypes.Inbound) {
      return 'Inbound';
    } else if (directionNumber === api.InteractionDirectionTypes.Outbound) {
      return 'Outbound';
    }
    return 'Internal';
  }
  protected getSecondsElapsed(startDate): number {
    const EndDate = new Date();
    if (typeof startDate === 'string') {
      startDate = new Date(startDate);
    }
    return Math.round((EndDate.getTime() - startDate.getTime()) / 1000);
  }
  protected getWho(id): IActivityDetails {
    for (let i = 0; i < this.storageService.whoList.length; i++) {
      if (this.storageService.whoList[i].objectId === id) {
        return this.storageService.whoList[i];
      }
    }
  }
  protected getWhat(id): IActivityDetails {
    for (let i = 0; i < this.storageService.whatList.length; i++) {
      if (this.storageService.whatList[i].objectId === id) {
        return this.storageService.whatList[i];
      }
    }
  }
  protected loadQuickComment(value) {
    this.storageService.setDescription(this.storageService.currentInteraction.interactionId, this.quickCommentList[value]);
    this.activitySave(false);
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    return whoObject.objectType + ': ' + whoObject.objectName;
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    return whatObject.objectType + ': ' + whatObject.objectName;
  }
}
