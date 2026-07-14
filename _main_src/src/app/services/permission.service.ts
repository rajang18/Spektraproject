import { Injectable } from '@angular/core'; 
import { UserRoleAccessPermission } from '../shared/models/appsettings.model'; 

@Injectable({
  providedIn: 'root'
})
export class PermissionService { 
  

  private _permissionlist:UserRoleAccessPermission[];
  
  constructor() {
  } 

  setPermissionList(permissionLst:UserRoleAccessPermission[]){
    this._permissionlist = permissionLst;
  }

  permissionExist(){
    if(this._permissionlist?.length>0)
    {
      return true;
    }
    return false;
  }

  hasPermission(key: string): string {
    let accessType = "Denied"; 
    // Ensure this._permissionlist exists and key is valid
    if (this.permissionExist() && key && this._permissionlist && Array.isArray(this._permissionlist)) {
      // Iterate through the permission list
      this._permissionlist.forEach(v => {
        if (v.ActionableElement.toString().toLocaleLowerCase() === key.toString().toLocaleLowerCase()) {
          accessType = v.AccessType;
        }
      });
    } 
    return accessType;
  }
}
