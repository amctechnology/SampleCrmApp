import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { LoggerService } from './../logger.service';
@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  @Output() CreateNewEntity: EventEmitter<any> = new EventEmitter<any>();
  constructor() { }

  ngOnInit() {
  }

  protected createNewEntity(type) {
    this.CreateNewEntity.emit(type);
  }
}
