import { Component, AfterViewChecked, OnInit, ElementRef } from '@angular/core';
import * as applicationAPI from 
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewChecked {
  height: number;
  el: ElementRef;
  constructor(el: ElementRef) {
    this.height = 500;
    this.el = el;
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  ngAfterViewChecked(): void {
    this.setHeight();

  }
  private setHeight(): void {
    const newHeight = this.getHeight();
    if (newHeight !== this.height) {
      this.height = newHeight;
      channelApi.setSoftphoneHeight(this.height);
    }
  }

  private getHeight(): number {
    return this.el.nativeElement.children[0].scrollHeight + 5;
  }
}
