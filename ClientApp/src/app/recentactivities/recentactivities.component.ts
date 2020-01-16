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
  @Input() quickCommentList: string[];
  @Output() saveActivity: EventEmitter<string> = new EventEmitter<string>();
  @Output() getRecentWorkItem: EventEmitter<string> = new EventEmitter<string>();
  @Output() screenpopWorkItem: EventEmitter<string> = new EventEmitter();

  collapseToggle: boolean;

  constructor(private loggerService: LoggerService, protected storageService: StorageService) {
    this.collapseToggle = true;
  }

  protected submitActivity(scenarioId: string) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : Submit Activity. Scenario ID : ' + scenarioId);
    try {
      this.storageService.activityList[scenarioId].IsProcessing = true;
      this.saveActivity.emit(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Submit Activity. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : Submit Activity. Scenario ID : ' + scenarioId);
  }

  protected retrieveActivity(scenarioId: string) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : Retrieve Activity. Scenario ID : ' + scenarioId);
    try {
      this.getRecentWorkItem.emit(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Retrieve Activity. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : Retrieve Activity. Scenario ID : ' + scenarioId);
  }

  protected openActivity(scenarioId: string) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : Open Activity. Scenario ID : ' + scenarioId);
    try {
      this.screenpopWorkItem.emit(this.storageService.activityList[scenarioId].ActivityId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Open Activity. Scenario ID : '
      + scenarioId + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : Open Activity. Scenario ID : ' + scenarioId);
  }

  protected expandAndCollapse(isExpand: boolean) {
    if (isExpand) {
      this.collapseToggle = true;
    } else {
      this.collapseToggle = false;
    }
  }

  protected expandAndCollapseRecentActivity(isExpand: boolean, scenarioId: string) {
    try {
      this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : Expand/Collapse Activity. Scenario ID : '
      + scenarioId + ', IsExpand : ' + isExpand);
      if (isExpand) {
        this.storageService.activityList[scenarioId].IsRecentWorkItemLoading = true;
        this.storageService.workingRecentScenarioId = scenarioId;
        this.retrieveActivity(scenarioId);
      } else {
        this.storageService.workingRecentScenarioId = null;
      }
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Expand/Collapse Activity. Scenario ID : '
      + scenarioId + ', IsExpand : ' + isExpand + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : Expand/Collapse Activity. Scenario ID : '
    + scenarioId + ', IsExpand : ' + isExpand);
  }

  protected onNameChange(event: any) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : On Name Change. Input : ' + JSON.stringify(event));
    try {
    this.storageService.UpdateWhoObjectSelectionChange(event.currentTarget.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : On Name Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : On Name Change. Input : ' + JSON.stringify(event));
  }

  protected onRelatedToChange(event: any) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : On Related To Change. Input : ' + JSON.stringify(event));
    try {
    this.storageService.UpdateWhatObjectSelectionChange(event.currentTarget.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : On Related To Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : On Related To Change. Input : ' + JSON.stringify(event));
  }

  protected onSubjectChange(event: any) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : On Subject Change. Input : ' + JSON.stringify(event));
    try {
    this.storageService.setSubject(event.srcElement.value, this.storageService.workingRecentScenarioId);
    this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : On Subject Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : On Subject Change. Input : ' + JSON.stringify(event));
  }

  protected onCallNotesChange(event: any) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : On Call Notes Change. Input : ' + JSON.stringify(event));
    try {
      this.storageService.setDescription(event.srcElement.value.trim(), this.storageService.workingRecentScenarioId);
      this.storageService.compareActivityFields(this.storageService.workingRecentScenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : On Call Notes Change. Input : '
      + JSON.stringify(event) + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : On Call Notes Change. Input : ' + JSON.stringify(event));
  }

  protected parseWhoObject(whoObject: IActivityDetails): string {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : Parsing Who Object. Input : ' + JSON.stringify(whoObject));
    try {
      return ((whoObject.objectType) ? whoObject.objectType : 'Entity') + ': ' + whoObject.objectName;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Parsing Who Object. Input : '
      + JSON.stringify(whoObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected parseWhatObject(whatObject: IActivityDetails): string {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : Parsing What Object. Input : ' + JSON.stringify(whatObject));
    try {
      return ((whatObject.objectType) ? whatObject.objectType : 'Entity') + ': ' + whatObject.objectName;
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Parsing What Object. Input : '
      + JSON.stringify(whatObject) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected loadQuickComment(comment: string, scenarioId: string) {
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : START : Load Quick Comments. Input : ' + comment);
    try {
      const descriptionToSet = this.quickCommentList[comment];
      const descriptionValue = this.storageService.activityList[scenarioId].Description;
      if (!descriptionValue) {
        this.storageService.setDescription(descriptionToSet, scenarioId);
      } else {
        this.storageService.setDescription(descriptionValue + '\n' + descriptionToSet, scenarioId);
      }
      this.storageService.compareActivityFields(scenarioId);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Recent Activity : ERROR : Load Quick Comments. Input : '
      + comment + '. Error Information : ' + JSON.stringify(error));
    }
    this.loggerService.logger.logTrace('Salesforce - Recent Activity : END : Load Quick Comments. Input : ' + comment);
  }
}
