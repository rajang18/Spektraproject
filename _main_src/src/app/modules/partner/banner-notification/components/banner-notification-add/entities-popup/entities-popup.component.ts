import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions, NgbModalRef, NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import _ from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-entities-popup',
  templateUrl: './entities-popup.component.html',
  styleUrl: './entities-popup.component.scss'
})
export class EntitiesPopupComponent extends C3BaseComponent implements OnInit{
  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  updatedproductDetails: any[] = [];
  jsonData:any = null;
  productDetails:any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('name') name: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  entityName:string;
  recordId:string;
  modalRef: NgbModalRef;
  @Input() customers:any;
  @Input() entityCategory:any;
  @Input() requiredEntity:any;
  isChecked:boolean = false;
  selectedEn:any;

  constructor(
    private _modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private _commonService: CommonService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private activemodal: NgbActiveModal,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

  }
  ngOnInit(): void {
    this.handleTableConfig();
  }

  closeModal(){
    this._modalService.dismissAll();
  }
  
  handleTableConfig() {
    this.customers
    const self = this;
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          ordering:false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: this.customers,
          columns: [
            {
              type:'string',
              className:'col-md-3',
              searchable:true,
              orderable: false,
              data:'Name',
              defaultContent: '',
              ngTemplateRef: {
              ref: this.name,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            },
          ],
        };
        this.cdRef.detectChanges();
      });
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  onChange(event:any,data:any){
    this.selectedEn = data.EntityName;
    this.isChecked = event.target.checked;
    _.each(this.customers, (obj) => {
      let c3id = obj.C3ID ?? obj.C3Id;
      let dataC3Id = data.C3ID ?? data.C3Id;
      if (c3id == dataC3Id) {
        obj.Selected = this.isChecked;
      }
    });
  }

  updateCheckbox(selectedEntityName:any){
    let isAvailable = this.customers.find((e) => e.Selected == true)
    this.requiredEntity.map((k:any) =>{
      if(k.EntityName == selectedEntityName){
        k.Selected = isAvailable?true:false;
        this.cdRef.detectChanges();
      }
    })
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }

  onsubmit(){
    this.updateCheckbox(this.selectedEn);
   //this.customers = this.customers.filter((a:any) => a.Selected === true);
    this.activemodal.close(this.customers);
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }

  

}
