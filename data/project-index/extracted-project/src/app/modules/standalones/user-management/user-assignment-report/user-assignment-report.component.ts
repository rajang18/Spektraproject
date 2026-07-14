import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { EditorModule } from '@tinymce/tinymce-angular';
import { Select2Module } from 'ng-select2-component';
import { TranslationModule } from 'src/app/modules/i18n';
import { UserManagementService } from 'src/app/modules/partner/settings/services/user-management.service'; 
import { Nodes } from 'src/app/modules/partner/settings/models/user-management';

declare const $: any;

@Component({
  standalone: true,
  imports:[
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslationModule,
    EditorModule,
    NgSelectModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    FormsModule,
    Select2Module,
    NgSelectModule
],
  providers:[UserManagementService],
  
  selector: 'app-user-assignment-report',
  templateUrl: './user-assignment-report.component.html',
  styleUrl: './user-assignment-report.component.scss'
})
export class UserAssignmentReportComponent implements OnInit {
  @Input() entityDetails:any;
  nodes:Nodes;

  constructor(
    private _modalService: NgbModal, 
    public activeModal: NgbActiveModal, 
    private _fb: FormBuilder,
    private _toastService:ToastrService,
    private _translateService:TranslateService
  ){

  }
 
  ngOnInit(): void {
    this.convertToJson();
    
  }
  checkNames(elm: any) {
    if (elm.children) {
        elm.children = elm.children.map( (ex: any) =>({
            ...ex,
            text: ex.name,
            ...this.checkNames(ex),
        }))
    }
    return elm;
  }

  convertToJson(){
    this.nodes = JSON.parse(this.entityDetails)
    $('#kt_docs_jstree_checkable').jstree({
        plugins: ["wholerow", "checkbox", "types"],
        core: {
            themes : {
                responsive: false
            },
            data: this.nodes.map( (elm: any) => ({
                ...elm, 
                text: elm.name,
                ...this.checkNames(elm),
            }))
        },
        types : {
            default : {
                icon: "fa fa-plus-square"
            },
            file : {
                icon : "ki-solid ki-file  text-warning"
            }
        },
        checkbox:{
          three_state: false,
          cascade:'down'
        }

    });
  }
  
   onSubmit() {
    // Get the selected nodes
    const selectedNodes = Object.values($('#kt_docs_jstree_checkable').jstree('get_checked', null, true)).join(',');
    if(selectedNodes.length > 0)
    {
           this.activeModal.close(selectedNodes);
    }
    else
    {
      this._toastService.error(this._translateService.instant('TRANSLATE.USER_MANAGEMENT_EXPORT_USER_ASSIGNMENT_REPORT_VALIDATION_ERROR'));
      this.closeModalPopup();
    }
  }
  
  closeModalPopup() {
    this._modalService.dismissAll();
  }


}
