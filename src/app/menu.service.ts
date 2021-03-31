import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  mainMenu!: any[];
  constructor() { }

  getMainMenu(){
    if(!this.mainMenu || !this.mainMenu.length){
      const j= localStorage.getItem('mainMenu');
      this.mainMenu= j ? JSON.parse(j) : [];
    }
    return this.mainMenu;
  }

  setMainMenu(m: any){    
    const s= m ? JSON.stringify(m) : '[]';
    localStorage.setItem('mainMenu', s);
  }

}
