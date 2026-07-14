import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LinkedProvider } from '../models/resellers.model';
import { resellerDetails } from '../models/resellers.model';


@Injectable({
  providedIn: 'root'
})
export class ResellersListingService {
    private apiUrl = environment.apiBaseUrl;
  
    constructor(private http: HttpClient) {}

    getResellers({ StartInd, Name, SortColumn, SortOrder, PageSize }: any) {
        return this.http.get(`${this.apiUrl}/resellers/`, {
          params: {
            v: '1714029750585',
            PageSize,
            SortColumn,
            SortOrder,
            StartInd,
            TagValues: '',
            Name,
          },
        });
      }

      upDateResellerName(data: resellerDetails, c3Id: string) {
        return this.http.post(`${this.apiUrl}/resellers/UpdateName`, {
          ResellerC3Id: c3Id,
          ResellerName: data.Name
        });
    
      }

      onBoardNewReseller(data:any){
        return this.http.post(`${this.apiUrl}/resellers/`, data)
      }


      checkEmail(email: string, entityName: string, recordId: any): Observable<any> {
        return this.http.get(`${this.apiUrl}/user/${email}/CanAddCustomer/${entityName}/${recordId}`);
      }
      
      getAccountManagerDetailsOfReseller(row:any){
        return this.http.get(`${this.apiUrl}/accountManagers/Reseller/${row.C3Id}/GetAccountManagerDetailsOfEntity`);
    
      }
      getLinkedProvidersForReseller(resellerId: string): Observable<LinkedProvider[]> {
        const url = `${this.apiUrl}/resellers/${resellerId}/linkedproviders`;
        return this.http.get<any>(url);
      }
     
    
      unlinkProvider(resellerC3Id: string, providerName: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/resellers/${resellerC3Id}/provider/${providerName}/unlink`);
      }
    

    linkProvider(resellerC3Id: string, providerName: string, providerBusinessId: string): Observable<any> {
      return this.http.post<any>(`${this.apiUrl}/resellers/${resellerC3Id}/provider/${providerName}/link/${providerBusinessId}`, null);
    }

    getConfiguration(c3Id:string|null){
      return this.http.get(`${this.apiUrl}/resellers/${c3Id}/configurations`);
    }

    updateConfiguration(c3Id:string|null, reqBody:any){
      return this.http.post(`${this.apiUrl}/resellers/${c3Id}/update/${reqBody.Name}/configuration`,reqBody);
    }
    
    deleteConfiguration(c3Id:string|null, row:any){
      return this.http.delete(`${this.apiUrl}/resellers/${c3Id}/configuration/${row.Name}/Provider/${row.ProviderName}`);
    }

    getProvidersForBulkResellerOnboarding(includeNonCSP : boolean){
      return this.http.get(`${this.apiUrl}/common/providersForOnboarding/${includeNonCSP}`);
    }

    updateTheStatusAsComplete(latestBatchId : any){
      return this.http.put(`${this.apiUrl}/resellers/updatebulkonboardstatus/${latestBatchId}`,null);
    }

    getBulkOnboardResellersStatus(){
      return this.http.get(`${this.apiUrl}/resellers/bulkonboardsummary/BulkOnboardProviderResellers`);
    }
    downloadPORReport(providerName: string){
    return this.http.get(`${this.apiUrl}/resellers/downloadPORResellerDetails?providerName=${providerName}`, {
    responseType: 'blob' 
    });
    } 

    getNonOnboardedResellers(providerName : any){
      return this.http.get(`${this.apiUrl}/resellers/providers/${providerName}/notonboarded`);
    }

    bulkOnboardResellers(bulkOnboardExistingResellersViewModel : any){
      return this.http.post(`${this.apiUrl}/resellers/queueforonboard`,bulkOnboardExistingResellersViewModel);
    }
  }
