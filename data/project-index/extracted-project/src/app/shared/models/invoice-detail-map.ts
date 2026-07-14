import { Type } from "@angular/core";
import { AztekInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/aztek-invoice-detail/aztek-invoice-detail.component";
import { DavynttInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/davyntt-invoice-detail/davyntt-invoice-detail.component";
import { DefaultInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/default-invoice-detail/default-invoice-detail.component";
import { ResolutionItInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/resolution-it-invoice-detail/resolution-it-invoice-detail.component";
import { SynovatecInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/synovatec-invoice-detail/synovatec-invoice-detail.component";
import { TeamventiInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/teamventi-invoice-detail/teamventi-invoice-detail.component";
import { TptInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/tpt-invoice-detail/tpt-invoice-detail.component";
import { TrndigitalInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/trndigital-invoice-detail/trndigital-invoice-detail.component";
import { VirtualitInvoiceDetailComponent } from "src/app/modules/standalones/invoice-templates/virtualit-invoice-detail/virtualit-invoice-detail.component";

export const InvoiceDetailMap = new Map<string, Type<any>>([

    ['default', DefaultInvoiceDetailComponent],
    ['aztek', AztekInvoiceDetailComponent],
    ['davyntt', DavynttInvoiceDetailComponent],
    ['resolutionit', ResolutionItInvoiceDetailComponent],
    ['synovatec', SynovatecInvoiceDetailComponent],
    ['teamventi', TeamventiInvoiceDetailComponent],
    ['tpt', TptInvoiceDetailComponent],
    ['trndigital', TrndigitalInvoiceDetailComponent],
    ['virtualit', VirtualitInvoiceDetailComponent],
]);