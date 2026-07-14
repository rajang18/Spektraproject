import { Injectable } from '@angular/core';
import _, { forEach } from 'lodash'; 
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class C3tableService {

  previousSelectedData:any[]= [];
  selectAllchecked:boolean;
  isNestedTable:boolean;
  isPageRenderedDict:{[key:string]:boolean} = {};
  isSearchDict:{[key:string]:string} = {};
  totalRecord:number;
  currentStartIndex:number = 1;
  checboxType:CheckboxType = CheckboxType.serverSideOnly; 
  public ___dataChange = new Subject<boolean>();
  isReloadHappen: boolean;
  isOldPaginationPersist: boolean = true;
 

  constructor() { 
  }  

  setPreviousSelectedData(data:any){
    this.previousSelectedData=data;
    if((data[0]?.TotalRecords && this.totalRecord != data[0]?.TotalRecords) || (data[0]?.TotalRows && this.totalRecord != data[0]?.TotalRows)){
      this.totalRecord = data[0]?.TotalRecords?data[0]?.TotalRecords :data[0]?.TotalRows;
    }
    this.checkBoxStatusChange(false);
    this.___dataChange.next(true)
  }

  compareData(obj: any) {
    if(!this.totalRecord && (obj.TotalRecords || obj.TotalRows)){
      this.totalRecord = obj.TotalRecords ? obj.TotalRecords : obj.TotalRows; 
    }
    if (this.previousSelectedData.length > 0) { 
      this.previousSelectedData = _.uniqWith(this.previousSelectedData, _.isEqual);
      return this.previousSelectedData.some(v => {
        let objCopy = { ...obj };
        let vCopy = { ...v };
        this.removeProperties(objCopy,vCopy); 
        return _.isEqual(vCopy, objCopy);
      });
    }
    else{
      return false;
    }
  }

  removeProperties(objCopy: any,vCopy) {
    this.propertiesToRemove.forEach(prop => delete objCopy[prop]);
    this.propertiesToRemove.forEach(prop => delete vCopy[prop]);
  }

  private getPreferredSelectionKey(obj: any): string | null {
    if (!obj) {
      return null;
    }

    const preferredKeySets = [
      ['C3Id', 'CurrencyCode'],
      ['C3Id'],
      ['CustomerId'],
      ['Id'],
      ['ID']
    ];

    for (const keys of preferredKeySets) {
      if (keys.every((key) => obj[key] !== undefined && obj[key] !== null && obj[key] !== '')) {
        return keys.map((key) => `${key}:${obj[key]}`).join('|');
      }
    }

    return null;
  }

  generateRowKey(obj: any) {
    const preferredKey = this.getPreferredSelectionKey(obj);
    if (preferredKey) {
      return preferredKey;
    }

    let cleaned = { ...obj };
    this.propertiesToRemove.forEach(prop => delete cleaned[prop]);
    return JSON.stringify(cleaned);
  }

  propertiesToRemove = ["isCheckBoxChecked", "TotalRecords", "TotalRows", "RowNum"];

  removeUncheckedCheckBox(obj: any){
    this.previousSelectedData = this.previousSelectedData.filter(v => {
      let objCopy = { ...obj };
      let vCopy = { ...v };

      delete objCopy.isCheckBoxChecked;
      delete vCopy.isCheckBoxChecked;
      delete objCopy.TotalRecords;
      delete vCopy.TotalRecords;
      this.selectAllchecked = false;

      return !_.isEqual(vCopy, objCopy); // ✅ Keep only items that are NOT equal to obj
    });
  }

  resetData(){
    this.previousSelectedData = [];
    this.selectAllchecked=false;
    this.isNestedTable=false;
    this.isPageRenderedDict = {};
    this.isSearchDict = {};
    this.totalRecord=null; 
    this.currentStartIndex = 1
    this.isReloadHappen = false;
  }
  
  checkBoxStatusChange(state:boolean){
    const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
    setTimeout(()=>{
      selectAllCheckbox.disabled = state;  
    },10)
  }
  
}

export enum CheckboxType{
  /// this will be used for server side pagination and while click select all we will get all data through API and keep it in "previousSelectedData"
  serverSideWithapi,
  /// this will be used for server side pagination and while click select all we will set selectall is true for post request 
  serverSideOnly,
  /// this will be used for client side pagination and while click select all get all data through data table and keep it in "previousSelectedData"
  clientSideOnly,
  none
}
