import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ProfileService } from 'src/app/modules/home/profile/services/profile.service';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CommonService } from 'src/app/services/common.service';
import { ToastService } from 'src/app/services/toast.service';
import { CustomNotificationService } from '../../../services/custom-notification-service.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TaggedEntitiesDetailsComponent } from '../tagged-entities-details/tagged-entities-details.component';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-custom-row',
  templateUrl: './add-custom-row.component.html',
  styleUrl: './add-custom-row.component.scss'
})
export class AddCustomRowComponent implements OnInit, OnDestroy{
  @Input() address!: any; 
  @Input() data:any;
  custom: FormGroup; 
  eventName: any; 
  selectedEntity: any; 
  eventId: any; 
  selectedId:any;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  private destroy$ = new Subject<void>(); // Subject to signal component destruction
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild(C3TableComponent) c3TableComponent?: C3TableComponent;
  allEntities:any  [] =[];
  customNotificationEvents:any[] = [];
  selectedProducts:any [] = [];
  modalRef: NgbModalRef;
  selectedEntitiesName:any;
  selectedEntities:any[] = [];
  selectedProductCount:any = 0
  selectedPlanCount:any = 0;
  isError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private _customNotificationService: CustomNotificationService,
    private toasterService: ToastService,
    private translateService: TranslateService,
    private _modalService: NgbModal,
    private _unsavedChangesService: UnsavedChangesService
  ) {
    // Initialize form with default values and validators
    this.custom = this.fb.group({
      eventName: ['',Validators.required],
      eventEntity: ['',Validators.required],
      eventId: ['',Validators.required],
      selectedEntity: ['',Validators.required],
      Entitydetails:[''],
      SelectedProductDetails:['']
      // template: ['',Validators.required],
      // startDate: ['',Validators.required],
      // endDate: ['',Validators.required],
      // selectedEntity:['',Validators.required],
      
    });
    this.custom.valueChanges.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(value => {
   //   this._customNotificationService.updateFormData(value);
      this._unsavedChangesService.setUnsavedChanges(this.custom.dirty);
    });
  }

  ngOnInit(): void { 
    this.loadInitialData();
    this.selectedId = this.data.index;
  }

   /**
   * Load initial data for address types and countries.
   */
   private loadInitialData(): void {
    this.getCustomNotification();
  }

  getEntityDetails(){
    this._customNotificationService.getEntityDetails().subscribe((response:any) =>{
      var reqEntities = ["Customer", "ProductVariant", "PlanProduct"];
      this.allEntities = response.Data.filter((item:any) => reqEntities.includes(item.EntityName));
      this.allEntities;
    })
  }

  oneventSelection(){
    this.allEntities = [];
    this.selectedEntities = [];
    this.selectedEntitiesName = '';
    this.custom.get('eventEntity')?.setValue('');
    var event = this.custom.value.eventId;
    this._customNotificationService.taggedEntityDetails.find(v=>v.Index == this.selectedId).EventId = event;
    this._customNotificationService.getCustomNotificationEventEntities(event).subscribe((response:any) =>{
      this.allEntities = response.Data;
    })
  }

  onEntitySelection(){
    var entities = this.custom.value.eventEntity;
    this.selectedEntities = this.allEntities.filter((e:any) => e.EntityID == entities );
    this.selectedEntitiesName = this.selectedEntities[0].EntityName;
    this.custom.patchValue({SelectedProductDetails: this.selectedProducts,Entitydetails:this.selectedEntities})
    this._customNotificationService.updateLocalFormData(this.custom.value)
    this.validateEntity();
    this._customNotificationService.taggedEntityDetails.find(v=>v.Index == this.selectedId).Entity = this.selectedEntitiesName;
    this._customNotificationService.taggedEntityDetails.find(v=>v.Index == this.selectedId).Entitydetails = this.selectedEntities;
    if(this.selectedEntitiesName == 'Customer' && !this.isError) {
      this._customNotificationService.updateFormData(this.custom.value);
    }
  }

  getCustomNotification(){
   this._customNotificationService.getCustomNotificationdata().subscribe((response:any) =>{
      this.customNotificationEvents = response.Data;
    })
  }

  validateEntity() {
    let currentObect = this.custom.get('eventEntity');
    let currentEventId = this.custom.get('eventId');
    let taggedEntitie:any = [];
    taggedEntitie = taggedEntitie.concat(this.data.mode);
    let isError: boolean = false;
    taggedEntitie.forEach((res) => {
      if (res.EventId == currentEventId.value) {
        if ((res?.Entitydetails[0] != undefined && res?.Entitydetails[0]?.EntityID == currentObect?.value) && (res?.Entitydetails[0]?.EntityName != 'PlanProduct')) {
          // vm.taggedEntityDetails[index].Entitydetails = null;
          this.custom.get('eventEntity').reset();
          this.toasterService.error(this.translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_TAGGED_ENTITIES_DETAILS_ERROR'))
          isError = true;
        }
        else if ((res?.Entitydetails?.EntityID == currentObect?.value) && (res?.Entitydetails?.EntityName != 'PlanProduct')) {
          // vm.taggedEntityDetails[index].Entitydetails = null;
          this.custom.get('eventEntity').reset();
          this.toasterService.error(this.translateService.instant('TRANSLATE.MESSAGE_CUSTOM_NOTIFCATION_TAGGED_ENTITIES_DETAILS_ERROR'))
          isError = true;
        }
      }
      this.isError = isError; 
    })
  }

  onCancel() {
    //this.AddressesDetailsComponent.removeRow();
    this._customNotificationService.removeAdditionalRow.next(this?.selectedId || null)
  
  }
  /**
   * Cleanup subscriptions on component destroy.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);

  }

  getTaggedEntitiesPopup(){
    var notificationMessageId = 0;
    var eventId = this.custom.value.eventId;
    this.modalRef = this._modalService.open(TaggedEntitiesDetailsComponent, { size: 'xl' });
    this.modalRef.componentInstance.notificationMessageId = notificationMessageId;
    this.modalRef.componentInstance.eventId = eventId;
    this.modalRef.componentInstance.selectedEntitiesName = this.selectedEntitiesName;
    this.modalRef.componentInstance.EventEntityId = this.custom.value.eventEntity;
    this.modalRef.result.then(
      (result) => {
        if (result) {
          this.selectedProducts = result;
          this.selectedProductCount = result.SelectedProductCount;
          this.selectedPlanCount = result.SelectedPlanCount;
          this.custom.patchValue({SelectedProductDetails: this.selectedProducts,Entitydetails:this.selectedEntities})
          this.selectedProducts = result;
           this._customNotificationService.updateFormData(this.custom.value)

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        this.modalRef.close();
      }
    );
  }


}
