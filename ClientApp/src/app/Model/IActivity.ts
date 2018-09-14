import { IActivityDetails } from './../Model/IActivityDetails';
export interface IActivity {
  WhoObject: IActivityDetails;
  WhatObject: IActivityDetails;
  CallType: string;
  CallDurationInSeconds: string;
  Subject: string;
  Description: string;
  Status: string;
  ActivityDate: string;
  TimeStamp: Date;
  ActivityId: string;
  InteractionId: string;
}
