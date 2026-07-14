export class productSearchModel{
    PageSize : number;
    StartInd : number;
    SortColumn : string;
    SortOrder : number | null;
    MinQuantity :number | null;
    MaxQuantity : number | null;
    OrderStartDate : null;
    OrderEndDate : Date | null;
    ExpireInDays : number | null;
    EntityName :string | null;
    RecordId : string |null
}