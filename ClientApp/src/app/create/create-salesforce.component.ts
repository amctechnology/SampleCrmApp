import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { LoggerService } from '../logger.service';

@Component({
  selector: 'app-create',
  templateUrl: './create-salesforce.component.html',
  styleUrls: ['./create-salesforce.component.css']
})

export class CreateSalesforceComponent {

  @Output() CreateNewEntity: EventEmitter<string> = new EventEmitter<string>();
  isCreateMaximized: boolean;
  @Input() Entities: any;

  constructor(private loggerService: LoggerService) {
    this.isCreateMaximized = true;
  }

  protected createNewEntity(type: string) {
    try {
      this.CreateNewEntity.emit(type);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Create : ERROR : Create New Entity. Input :'
      +  type + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected getEntities() {
    try {
      return Object.keys(this.Entities);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Create : ERROR : Create New Entity. Error Information : ' + JSON.stringify(error));
    }
  }

  protected getDisplay(entity) {
    try {
      return entity.substring(0, entity.indexOf('|'));
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Create : ERROR : Create New Entity. Input :'
      +  JSON.stringify(entity) + '. Error Information : ' + JSON.stringify(error));
    }
  }

  protected getImage(entity) {
    try {
      return entity.substring(entity.indexOf('|') + 1);
    } catch (error) {
      this.loggerService.logger.logError('Salesforce - Create : ERROR : Create New Entity. Input :'
      +  JSON.stringify(entity) + '. Error Information : ' + JSON.stringify(error));
    }
  }
}
