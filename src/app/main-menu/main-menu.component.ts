import { AfterViewInit } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../menu-item';
import { MenuService } from '../menu.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit, AfterViewInit {
  menuItems!: MenuItem[];
  constructor(private menuService: MenuService) { }
  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.menuItems = this.menuService.getMainMenu();
    
    // [
    //   {
    //     name: 'aaa', link: '', children: [
    //       { name: 'aaac1', link: '' }, { name: 'aaac2', link: '' }, { name: 'aaac3', link: '' }
    //     ]
    //   },
    //   {
    //     name: 'bbb', link:'', children: [
    //       { name: 'bbbc1', link: '' }, { name: 'bbbc2', link: '' }, { name: 'bbbc3', link: '' }
    //     ]
    //   }
    // ];
  }

}
