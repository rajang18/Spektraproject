export class TaxDetails {
    Id: number | null;
    EntityName: string | null;
    RecordId: string | null;
    EffectiveFrom: string | null;
    TaxPercentage: number | null;
    CountryId: number | null;
    StateProvinceId: number | null;
    TaxCode: string | null;
    ZIPCode: string | null;
    TaxName: string | null;
    TaxTypeId: number | null;
    SubTaxes: SubTaxDetails[];
    SaleTypeId: number | null;
}
export class SubTaxDetails {
    Id: number | null;
    TaxName: string | null;
    TaxPercentage: number | null;
    SequenceNumber: number | null;
}

export class TaxTypeDetails {
    ID: number | null;
    Name: string | null;
    Description: string | null;
    CreateBy: string | null;
    CreateDate: string | null;
    TaxPercentagesByRegions: []
}

export class SaleTypeDetails {
    ID: number | null;
    Name: string | null;
    IsActive: boolean;
    Description: string | null;
    Products: [];
    TaxPercentagesByRegions: [];
}

export class CountryDetails {
    ID: number | null;
    Name: string | null;
    Code: string | null;
}

export class StateProvinceDetails {
    ID: number | null;
    Name: string | null;
    CountryId: number | null;
    Code: string | null;
    IsActive: boolean;
    TaxPercentagesByRegions: [];
    Country: string | null;
}