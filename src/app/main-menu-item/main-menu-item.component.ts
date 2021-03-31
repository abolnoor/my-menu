import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from '../menu-item';

@Component({
  selector: 'app-main-menu-item',
  templateUrl: './main-menu-item.component.html',
  styleUrls: ['./main-menu-item.component.scss']
})
export class MainMenuItemComponent implements OnInit {
  @Input()
  items!: MenuItem[];
  @ViewChild('childMenu', {static: true}) public childMenu: any;

  constructor() { }

  ngOnInit(): void {
  }

}
