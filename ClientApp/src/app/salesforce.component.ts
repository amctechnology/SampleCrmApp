import { Component, AfterViewChecked, ElementRef } from '@angular/core';
import * as applicationAPI from '@amc-technology/davinci-api';
@Component({
  selector: 'app-root',
  templateUrl: './salesforce.component.html',
  styleUrls: ['./salesforce.component.css']
})
export class SalesforceComponent implements AfterViewChecked {
  height: number;
  el: ElementRef;
  constructor(el: ElementRef) {
    this.height = 500;
    this.el = el;
  }
  ngAfterViewChecked(): void {
    this.setHeight();
  }
  private setHeight(): void {
    const newHeight = this.getHeight();
    if (newHeight !== this.height) {
      this.height = newHeight;
      applicationAPI.setAppHeight(this.height);
    }
  }
  private getHeight(): number {
    return this.el.nativeElement.children[0].scrollHeight + 2;
  }
}
