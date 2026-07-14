/**
 * Handle Angular datatable params and map with API's
 * @param params
 * @returns
 */
export const mapParamsWithApi = (params: any) => {
  const { start, search, order, columns, length  } = params;
  const StartInd =  start / length + 1;
  const Name = search?.value || '';
  const [orderRow] = order as any[];
  const SortColumn = !!order?.length ? columns[orderRow?.column].data : '';
  const SortOrder = orderRow?.dir || '';

  const searchColumns = [...columns].reduce((acc: any, curr: any) => {
    if (!!curr?.search?.value) {
      acc[curr.data] = curr?.search?.value;
    }
    return acc;
  }, {});

  return {
    StartInd,
    Name,
    SortColumn,
    SortOrder,
    PageSize: length,
    length,
    ...searchColumns,
  };
};



export const checkboxColumn = {
  orderable: false,
  targets: 0,
  render: function (data: any, type: any, row: any, meta: any) {
      if (type === 'display') {
          data = row?.isHide ? '' : `<label  class="form-check form-check-sm form-check-custom form-check-left">
                      <input value="${meta.row}" class="dt-checkboxes row-selection-checkbox form-check-input"   type="checkbox" ${row?.IsAssigned ? 'checked' : ''}>
                      <span class="fw-semibold ps-2 fs-7 text-nowrap"></span>
                  </label>`;
      } 
      if(row.disableCheckBox){
        data = row?.isHide ? '' : `<label  class="form-check form-check-sm form-check-custom form-check-left">
        <input value="${meta.row}" class="dt-checkboxes row-selection-checkbox form-check-input"  disabled="row.disableCheckBox"  type="checkbox" ${row?.IsAssigned ? 'checked' : ''}>
        <span class="fw-semibold ps-2 fs-7 text-nowrap"></span></label>`;
      }

      return data;
  },
  checkboxes: {
      selectRow: true, // Enable row selection checkboxes
      selectAllRender: `
          <label class="form-check form-check-sm form-check-custom form-check-left">
              <input class="dt-checkboxes form-check-input" type="checkbox" >
              <span class="ps-3 text-nowrap">Select all</span>
          </label>
      `,
  },
  hideSelectAllLabel:{
    selectRow: true, // Enable row selection checkboxes
      selectAllRender: `
          <label class="form-check form-check-sm form-check-custom form-check-left">
              <input class="dt-checkboxes form-check-input" type="checkbox" >
              <span class="ps-3 text-nowrap"></span>
          </label>
      `,
  },
  checkboxesWithTooltip: {
      selectRow: true, // Enable row selection checkboxes
      selectAllRender: `
          <label class="form-check form-check-sm form-check-custom form-check-left">
              <input class="dt-checkboxes form-check-input" type="checkbox" >
              <span class="fw-semibold ps-2 fs-7 text-nowrap"></span>
              <i  id='tooltip-checkbox' class="ki-duotone ki-information-2 fs-6 ms-1" aria-hidden="true">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
              </i>
          </label>
      `,
  }
};


export const defaultCheckboxProps = {
  columnDefs: [{
      "defaultContent": "-",
      "targets": "_all"
  }],
  order: [[1, 'asc']],
  select: 'multi',
}


export const filterData = (dataTablesParameters: any, Data:any) => {
const columnSearchValues = dataTablesParameters.columns.reduce((acc: any, column: any, index: number) => {
if (column.search && column.search.value) {
  acc[column.data] = column.search.value.toLowerCase();
}
return acc;
}, {});

// Filter data based on column-specific search values
let filteredData = Data;

Object.keys(columnSearchValues).map((columnName: string) => {
const searchValue = columnSearchValues[columnName];
if (searchValue) {
  filteredData = filteredData.filter((item: any) =>
    item[columnName] && item[columnName].toString().toLowerCase().includes(searchValue)
  );
}
});

// apply sorting--------

const order = dataTablesParameters.order[0];
if (order) {
  const columnIndex = order.column; // Get column index to sort by
  const direction = order.dir; // Get sorting direction ('asc' or 'desc')

  const columnNameToSort = dataTablesParameters.columns[columnIndex]?.data;

  if (columnNameToSort) {
    filteredData = filteredData.sort((a: any, b: any) => {
      const aValue = a[columnNameToSort]?.toString().toLowerCase() || '';
      const bValue = b[columnNameToSort]?.toString().toLowerCase() || '';

      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }
}
return filteredData
}
