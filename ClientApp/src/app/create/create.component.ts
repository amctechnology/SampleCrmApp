import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  @Output() CreateNewEntity: EventEmitter<any> = new EventEmitter<any>();
  maximizeCreate: boolean;
  constructor() {
    this.maximizeCreate = true;
  }
  ngOnInit() {
  }
  protected createNewEntity(type) {
    this.CreateNewEntity.emit(type);
  }
  protected resizeCreate(size) {
    if (size === 'collapse') {
      this.maximizeCreate = false;
    } else {
      this.maximizeCreate = true;
    }
  }

}
