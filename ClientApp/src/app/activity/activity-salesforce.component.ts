import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as api from '@amc-technology/davinci-api';
import { IActivityDetails } from '../Model/IActivityDetails';
import { LoggerService } from '../logger.service';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-activity',
  templateUrl: './activity-salesforce.component.html',
  styleUrls: ['./activity-salesforce.component.css']
})
export class ActivitySalesforceComponent {
  @Input() quickCommentList: string[];
  @Output() ActivitySave: EventEmitter<string> = new EventEmitter<string>();
  @Input() quickCommentOptionRequiredCadArray: any;

  isActivityMaximized: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.loggerService.logger.logDebug('activity: Constructor start');
    this.isActivityMaximized = true;
    this.loggerService.logger.logDebug('activity: Constructor complete');
  }

  protected activitySave(scenarioId: string) {
    this.ActivitySave.emit(scenarioId);
    this.loggerService.logger.logDebug(`activity: Calling Save activity: ${scenarioId}`
    , api.ErrorCode.ACTIVITY
    );
  }

  protected onNameSelectChange(event) {
    this.storageService.UpdateWhoObjectSelectionChange(event.currentTarget.value, this.storageService.currentScenarioId);
    this.loggerService.logger.logDebug(`activity: Call from select box value changed: ${event.currentTarget.value}`,
      api.ErrorCode.ACTIVITY
    );
  }

  protected onRelatedToChange(event) {
    this.storageService.UpdateWhatObjectSelectionChange(event.currentTarget.value, this.storageService.currentScenarioId);
    this.loggerService.logger.logDebug(`activity: Related to select box value changed:  ${event.currentTarget.value}`,
      api.ErrorCode.ACTIVITY
    );
  }

  protected onSubjectChange(event) {
    this.storageService.setSubject(event.srcElement.value, this.storageService.currentScenarioId);
    this.loggerService.logger.logDebug(
      'activity: Subject value changed: ',
      api.ErrorCode.ACTIVITY
    );
  }

  protected onCallNotesChange(event) {
    this.storageService.setDescription(event.srcElement.value.trim(), this.storageService.currentScenarioId);
    this.loggerService.logger.logDebug('activity: Call notes value changed: ' + event.srcElement.value.trim(), api.ErrorCode.ACTIVITY);
  }

  protected loadQuickComment(comment: string) {
    if (this.quickCommentOptionRequiredCadArray[comment]) {
      // This means the option is configured to accept CAD Automatically
      // Loop through quickCommentOptionRequiredCadArray and replace {{cad}} with the cad coming from channel app
      let descriptionToSet = this.quickCommentList[comment];
      let cadFields = {};
      if (this.storageService.activityList[this.storageService.currentScenarioId]) {
          cadFields = this.storageService.scenarioToCADMap[this.storageService.currentScenarioId];
      }
      for (let i = 0; i < this.quickCommentOptionRequiredCadArray[comment].length; i++) {
        let keyToCheckIfCADExists = this.quickCommentOptionRequiredCadArray[comment][i];
        const stringToBeReplaced = this.quickCommentOptionRequiredCadArray[comment][i];
        keyToCheckIfCADExists = keyToCheckIfCADExists.replace('{{', '');
        keyToCheckIfCADExists = keyToCheckIfCADExists.replace('}}', '');
        if (cadFields[keyToCheckIfCADExists]) {
          descriptionToSet = descriptionToSet.replace(stringToBeReplaced, cadFields[keyToCheckIfCADExists].Value);
        }
      }
      if (!this.storageService.getDescription()) {
        this.storageService.setDescription(descriptionToSet, this.storageService.currentScenarioId);
      } else {
        this.storageService.setDescription(this.storageService.getDescription() + '\n' +
        descriptionToSet, this.storageService.currentScenarioId);
      }
    } else {
      if (!this.storageService.getDescription()) {
        this.storageService.setDescription(this.quickCommentList[comment], this.storageService.currentScenarioId);
      } else {
        this.storageService.setDescription(this.storageService.getDescription() + '\n' + this.quickCommentList[comment],
        this.storageService.currentScenarioId);
      }
    }
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    return whoObject.objectType + ': ' + whoObject.objectName;
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    return whatObject.objectType + ': ' + whatObject.objectName;
  }
}
