export class GetOrders_Result {
    TotalRows: number;
    ID: number;
    OrderNumber: string
    QuoteName: string;
    OrderStatus: string;
    OrderedOn: Date | null;
    OrderdBy: string;
    SiteName: string;
    DepartmentName: string;
    HasSiteEnabled: boolean;
    ApproveOrRejectRemark: string;
    CartAction: string;
}