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
  @Input() subject: string;
  @Output() ActivitySave: EventEmitter<IActivity> = new EventEmitter<IActivity>();
  whatId: string;
  whatName: string;
  whoId: string;
  whoName: string;
  callNotes: string;

  constructor() {
    this.whatId = null;
    this.whoName = null;
    this.whatName = null;
    this.whoId = null;
    this.subject = '';
    this. callNotes = 'Click to add a comment';
    this.ActivityMap = new Map();
  }

  ngOnInit() {
    this.interactionDisconnected.subscribe(event => {
      this.activitySave(true);
    });
  }

  setSelectedInteraction(interactionList) {
    console.log('interaction ' + interactionList.srcElement[0].id );
   // this.selectedInteraction = this.getInteraction(interactionList.srcElement[0].id);
  }
  protected parseWhat(whatObject): string {
    if (whatObject.objectType === 'Case') {
      return 'Case ' + whatObject.objectName;
    }
    return whatObject.objectName;
  }
  protected activitySave(clear_activity_fields) {
    if (this.currentInteraction && this.whoList.length !== 0 && this.whatList.length !== 0) {
    let activity = this.ActivityMap.get(this.currentInteraction.interactionId);
    activity.CallDurationInSeconds = this.getSecondsElapsed(activity.TimeStamp).toString();

    if (this.whatId === null) {
      activity.WhatId = this.whatList[0].objectId;
      activity.WhatName = this.whatList[0].objectName;
    } else {
      activity.WhatId = this.whatId ;
      activity.WhatName = this.whatName ;
    }
    if (this.whoId === null) {
      activity.WhoId = this.whoList[0].objectId;
      activity.WhoName = this.whoList[0].objectName;
    } else {
      activity.WhoId = this.whoId;
      activity.WhoName = this.whoName;
    }
    activity.Description = this.callNotes;
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
    this.whoId = event.srcElement[0].id;
    this.whoName = event.srcElement[0].value;
  }
  protected onRelatedToChange(event) {
    this.whatId = event.srcElement[0].id;
    this.whatName = event.srcElement[0].value;
  }
  protected onSubjectChange(event) {
    this.subject = event.srcElement.value;
  }
  protected onCallNotesChange(event) {
    this.callNotes = event.srcElement.value.trim();
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




  }
