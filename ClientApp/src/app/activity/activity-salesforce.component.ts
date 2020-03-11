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
  @Input() scenarioId: string;
  @Input() quickCommentList: string[];
  @Input() isAutoSave: boolean;
  @Input() quickCommentOptionRequiredCadArray: any;
  @Output() saveActivity: EventEmitter<string> = new EventEmitter<string>();

  isActivityMaximized: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.isActivityMaximized = true;
  }

  protected submitActivity(scenarioId: string) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : Submit Activity. Scenario ID : ' + scenarioId);
    try {
      this.storageService.activityList[scenarioId].IsProcessing = true;
      this.saveActivity.emit(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : Submit Activity. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : Submit Activity. Scenario ID : ' + scenarioId);
  }

  protected isChangesUnSaved(scenarioId: string): boolean {
    const activity = this.storageService.getActivity();
    this.storageService.activityList[scenarioId].IsUnSaved = (activity.IsUnSaved || (!activity.ActivityId && !this.isAutoSave));
    return this.storageService.activityList[scenarioId].IsUnSaved;
  }

  protected onNameChange(event) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : On Name Change. Input : ' + JSON.stringify(event));
    try {
      this.storageService.UpdateWhoObjectSelectionChange(event.currentTarget.value, this.scenarioId);
      this.storageService.compareActivityFields(this.scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : On Name Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : On Name Change. Input : ' + JSON.stringify(event));
  }

  protected onRelatedToChange(event) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : On Related To Change. Input : ' + JSON.stringify(event));
    try {
      this.storageService.UpdateWhatObjectSelectionChange(event.currentTarget.value, this.scenarioId);
      this.storageService.compareActivityFields(this.scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : On Related To Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : On Related To Change. Input : ' + JSON.stringify(event));
  }

  protected onSubjectChange(event) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : On Subject Change. Input : ' + JSON.stringify(event));
    try {
      if (event.type === 'keyup' && this.storageService.activityList[this.scenarioId].IsUnSaved) {
        return;
      }
      this.storageService.setSubject(event.srcElement.value, this.scenarioId);
      this.storageService.compareActivityFields(this.scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : On Subject Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : On Subject Change. Input : ' + JSON.stringify(event));
  }

  protected onCallNotesChange(event) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : On Call Notes Change. Input : ' + JSON.stringify(event));
    try {
      if (event.type === 'keyup' && this.storageService.activityList[this.scenarioId].IsUnSaved) {
        return;
      }
      this.storageService.setDescription(event.srcElement.value.trim(), this.scenarioId);
      this.storageService.compareActivityFields(this.scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : On Call Notes Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : On Call Notes Change. Input : ' + JSON.stringify(event));
  }

  protected loadQuickComment(comment: string) {
    this.loggerService.logger.logTrace('Salesforce - Activity : START : Load Quick Comments. Input : ' + comment);
    try {
      let descriptionToSet = this.quickCommentList[comment];
      if (this.quickCommentOptionRequiredCadArray[comment]) {
        let cadFields = {};
        if (this.storageService.activityList[this.scenarioId]) {
            cadFields = this.storageService.scenarioToCADMap[this.scenarioId];
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
      }
      if (!this.storageService.getDescription()) {
        this.storageService.setDescription(descriptionToSet, this.scenarioId);
      } else {
        this.storageService.setDescription(this.storageService.getDescription() + '\n' +
        descriptionToSet, this.scenarioId);
      }
      this.storageService.compareActivityFields(this.scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : Load Quick Comments. Input : '
      + comment + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Activity : END : Load Quick Comments. Input : ' + comment);
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    this.loggerService.logger.logTrace('Salesforce - Activity : Parsing Who Object. Input : ' + JSON.stringify(whoObject));
    try {
      return whoObject.objectType + ': ' + whoObject.objectName;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : Parsing Who Object. Input : '
      + JSON.stringify(whoObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    this.loggerService.logger.logTrace('Salesforce - Activity : Parsing What Object. Input : ' + JSON.stringify(whatObject));
    try {
      return whatObject.objectType + ': ' + whatObject.objectName;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Activity : ERROR : Parsing What Object. Input : '
      + JSON.stringify(whatObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }
}
