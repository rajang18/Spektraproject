import { Component } from '@angular/core';
import { CommonService } from 'src/app/services/common.service';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrl: './profile-user.component.scss'
})
export class ProfileUserComponent {
  
  constructor(
    private profileService: ProfileService,
    private commonService : CommonService

  ) { 
    this.profileService.contactEntityName = this.commonService.entityName;
    this.profileService.contactRecordId = this.commonService.recordId;
  }

}
