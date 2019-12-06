import { Component, Input, EventEmitter, Output } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { IActivityDetails } from '../Model/IActivityDetails';
import { StorageService } from '../storage.service';
import { LoggerService } from '../logger.service';

@Component({
  selector: 'app-recentactivities',
  templateUrl: './recentactivities.component.html',
  styleUrls: ['./recentactivities.component.css']
})
export class RecentactivitiesComponent {
  @Output() saveActivity: EventEmitter<string> = new EventEmitter<string>();
  @Output() screenpopWorkItem: EventEmitter<string> = new EventEmitter();

  collapseToggle: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('main: Constructor start');
    this.collapseToggle = true;
    this.loggerService.logger.logDebug('main: Constructor complete');
  }

  protected submitActivity(scenarioId: string) {
    this.storageService.activityList[scenarioId].IsProcessing = true;
    this.saveActivity.emit(scenarioId);
    this.loggerService.logger.logDebug(`activity: Calling Save activity: ${scenarioId}`
    , api.ErrorCode.ACTIVITY
    );
  }

  protected openActivity(scenarioId: string) {
    this.screenpopWorkItem.emit(this.storageService.activityList[scenarioId].ActivityId);
    this.loggerService.logger.logDebug(`activity: Opening activity: ${scenarioId}`
    , api.ErrorCode.ACTIVITY
    );
  }

  protected expandAndCollapse(isExpand: boolean) {
    if (isExpand) {
      this.collapseToggle = true;
    } else {
      this.collapseToggle = false;
    }
  }

  protected expandAndCollapseRecentActivity(isExpand: boolean, scenarioId: string) {
    if (isExpand) {
      this.storageService.workingRecentScenarioId = scenarioId;
    } else {
      this.storageService.workingRecentScenarioId = null;
    }
  }

  protected onNameSelectChange(event: any) {
    this.storageService.UpdateWhoObjectSelectionChange(event.currentTarget.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    this.loggerService.logger.logDebug(`activity: Call from select box value changed: ${event.currentTarget.value}`,
      api.ErrorCode.ACTIVITY
    );
  }

  protected onRelatedToChange(event: any) {
    this.storageService.UpdateWhatObjectSelectionChange(event.currentTarget.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    this.loggerService.logger.logDebug(`activity: Related to select box value changed:  ${event.currentTarget.value}`,
      api.ErrorCode.ACTIVITY
    );
  }

  protected onSubjectChange(event: any) {
    this.storageService.setSubject(event.srcElement.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    this.loggerService.logger.logDebug('activity: Subject value changed: ', api.ErrorCode.ACTIVITY);
  }

  protected onCallNotesChange(event: any) {
    this.storageService.setDescription(event.srcElement.value.trim(), this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    this.loggerService.logger.logDebug('activity: Call notes value changed: ' + event.srcElement.value.trim(), api.ErrorCode.ACTIVITY);
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    return whoObject.objectType + ': ' + whoObject.objectName;
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    return whatObject.objectType + ': ' + whatObject.objectName;
  }
}
