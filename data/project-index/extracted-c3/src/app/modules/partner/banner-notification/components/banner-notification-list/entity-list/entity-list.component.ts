import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-entity-list',
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss'
})
export class EntityListComponent extends C3BaseComponent implements OnInit, OnDestroy{

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
  @Input() EntityList:any;

  constructor(
    private _modalService: NgbModal,
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private _commonService: CommonService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;

  }
  ngOnInit(): void {
    this.handleTableConfig();
  }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
  }

  closeModal(){
    this._modalService.dismissAll();
  }
  
  handleTableConfig() {
    this.EntityList
    const self = this;
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          ordering:false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: this.EntityList,
          columns: [
            {
              type:'string',
              title: this.translateService.instant('TRANSLATE.CUSTOMER_OPERATING_ENTITIES_LABEL_TEXT_NAME'),
              className:'col-md-3',
              searchable:true,
              orderable: false,
              defaultContent: '',
              data:'Name',
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

}
