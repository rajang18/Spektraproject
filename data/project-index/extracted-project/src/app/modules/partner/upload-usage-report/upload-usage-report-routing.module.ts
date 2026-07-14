import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UploadUsageReportListingComponent } from './components/upload-usage-report-listing/upload-usage-report-listing.component';
import { UploadUsageReportHistoryListingComponent } from './components/upload-usage-report-listing/upload-usage-report-history-listing/upload-usage-report-history-listing.component';

const routes: Routes = [
    { path: '', component: UploadUsageReportListingComponent },
    { path:'viewuploadhistory', component:UploadUsageReportHistoryListingComponent}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UploadUsageReportRoutingModule { }
