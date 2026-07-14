import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class C3RouterService { 
  dictData:{[key:string]:any} = {}
  paginationInfo:{rowCount:number,pagIndex:number};

  constructor(private router:Router,private _appSettingsService:AppSettingsService) {
    this.paginationInfo = {
        rowCount:0,
        pagIndex:0
      }
   }

  navigate(c3Router:C3Router,setPagination:boolean = true){
    if(c3Router.keepHistory){
      let currentUrl = this.router.url;
      c3Router.historyUrl = currentUrl;
    }
    if(c3Router.data != null){
     c3Router.keyForData = this.randomKey();
     if(setPagination) {
        this.setPagination(c3Router);
     }
     this.dictData[c3Router.keyForData] = c3Router;
     // Add keyForData to NavigationExtras state
     c3Router.extras.state['keyForData'] = c3Router.keyForData
    }
    this.router.navigate(c3Router.commands,c3Router.extras);
  }

  setPagination(c3Router:any){
    if(this.paginationInfo.rowCount != this._appSettingsService.$rootScope.DefaultPageCount){
      c3Router.data.PageSize = this.paginationInfo.rowCount;
    }else{
      this.paginationInfo.rowCount = null
    }
    if(this.paginationInfo.pagIndex != 1 ){
      c3Router.data.ActivePage = this.paginationInfo.pagIndex;
    }else{
      c3Router.data.ActivePage = null;
    }
  }

  backToHistory(key:any,url:string=null,persistRouting:boolean = false){
    let val = this.dictData[key];
    if (val) {
      let c3Router = new C3Router();
      c3Router.keepHistory = false;
      c3Router.commands = persistRouting ? [url]: [val.historyUrl];
      c3Router.extras = {state:{keyForData: key}}; 
      //this.removeData(key);
      //c3Router.data = val.data;
      if(c3Router){
        this.navigate(c3Router); 
      }
      else{
        alert("undefined route")
      }
    }else{
      this.router.navigate([url]);
    }
  }

  setC3Input(val:string='',index:number = 0){
    // $('input[data-action="filter"]').val(val);  // Clear all column search inputs
    $('input[data-action="filter"]').eq(index).val(val);
  }
  getC3Input(index: number=0):string {
    // return $('input[data-action="filter"]').val()?.toString();  // Get the value of column search inputs
    return $('input[data-action="filter"]').eq(index).val()?.toString() || '';
  }

  retrieveData(key: string,isremoveData:boolean = true): any {
    const item = this.dictData[key];
    if (!item) {
      return null;
    }
    const currentUrl = this.router.url;
    // Return only if historyUrl belongs to current page
    if (currentUrl !== item.historyUrl) {
      return null;
    }
    let data  = null
    if(item){
      data = item.data; // Retrieve data using key
      if(isremoveData){
        //delete  item;  
      }
    //delete  item;
    } 
    return data;
  }

  removeData(key: string): any {
    delete this.dictData[key]; 
  }
   
  resetData(){
    this.dictData = {}
  }

  private randomKey(){
    return Math.random().toString(20).substring(2,8);
  }

}


export class C3Router {
  keepHistory:boolean;
  historyUrl:string;
  data:any;
  keyForData:string;
  commands: any[]
  extras?: NavigationExtras;
}
