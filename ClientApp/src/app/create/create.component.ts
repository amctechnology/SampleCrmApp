import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { LoggerService } from './../logger.service';
@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  @Output() CreateNewEntity: EventEmitter<string> = new EventEmitter<string>();
  isCreateMaximized: boolean;
  constructor(private loggerService: LoggerService) {
    this.loggerService.logger.logDebug('create: Constructor start');
    this.isCreateMaximized = true;
    this.loggerService.logger.logDebug('create: Constructor complete');
  }
  ngOnInit() {
  }
  protected createNewEntity(type) {
    this.loggerService.logger.logDebug('create: request screenpop for new Salesforce object type: ' +
      type);
    this.CreateNewEntity.emit(type);
  }
}
