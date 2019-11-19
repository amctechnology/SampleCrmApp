import { IActivityDetails } from './../Model/IActivityDetails';
export interface IActivity {
  WhoObject: IActivityDetails;
  WhatObject: IActivityDetails;
  CallType: string;
  CallDurationInSeconds: number;
  Subject: string;
  Description: string;
  Status: string;
  ActivityDate: string;
  TimeStamp: Date;
  ActivityId: string;
  ScenarioId: string;
  TaskSubtype: string;
  contactSource: {
    sourceType: string;
    source: string;
  };
  CadFields: {
    [key: string]: string
  };
  IsActive: boolean;
  IsProcessing: boolean;
  IsUnSaved: boolean;
}
