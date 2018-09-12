import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc/application-api';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import * as channelApi from '@amc/channel-api/';

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
  whoId: string;
  callNotes: string;


  constructor() {
    this.whatId = null;
    this.whoId = null;
    this.subject = null;
    this. callNotes = null;
    this.ActivityMap = new Map();
  }

  ngOnInit() {
    this.interactionDisconnected.subscribe(event => {
      this.activitySave(false);
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
  protected activitySave(event) {
    if (this.currentInteraction) {
    let activity = this.ActivityMap.get(this.currentInteraction.interactionId);
    activity.CallDurationInSeconds = this.getSecondsElapsed(activity.ActivityDate).toString();

    if (this.whatId === null) {
      activity.WhatId = this.whatList[0].objectId;
    } else {
      activity.WhatId = this.whatId ;
    }
    if (this.whoId === null) {
      activity.WhoId = this.whoList[0].objectId;
    } else {
      activity.WhoId = this.whoId;
    }

    activity.Description = this.callNotes;
    activity.CallType = this.getInteractionDirection(this.currentInteraction.direction);
    activity.Subject = this.subject;
    if (event) {
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
    this.currentInteraction = null;
  }
  protected onNameSelectChange(event) {
    this.whoId = event.srcElement[0].value;
  }
  protected onRelatedToChange(event) {
    this.whatId = event.srcElement[0].value;
  }
  protected onSubjectChange(event) {
    this.subject = event.srcElement.value;
  }
  protected onCallNotesChange(event) {
    this.callNotes = event.srcElement.value.trim();
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

  interface IActivityDetails  {
    objectType: string;
    displayName: string;
    objectName: string;
    objectId: string;
    url: string;
  }

interface IActivity {
  WhoId: string;
  WhatId: string;
  CallType: string;
  CallDurationInSeconds: string;
  Subject: string;
  Description: string;
  Status: string;
  ActivityDate: string;
  ActivityId: string;
  InteractionId: string;
}
