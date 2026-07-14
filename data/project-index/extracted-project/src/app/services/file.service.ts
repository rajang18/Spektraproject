import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { ToastService } from './toast.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from './notifier.service';
import { catchError, Observable, of, Subscription, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  _subscription: Subscription;
  private apiUrl = environment.apiBaseUrl

  constructor(private _http: HttpClient,
    private _commonService: CommonService,
    private _toastService: ToastService,
    private _translateService: TranslateService,
    private notifier: NotifierService,) { }

  getFile(url: string, downloadToLocal: boolean = true, params: any = {}) {
    const option = this._commonService.buildHttpParamsObject(params)
    const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=UTF-8' });
    return this._http.get(`${this.apiUrl}/${url}`, { headers, responseType: 'arraybuffer', observe: 'response', params: option }).subscribe((response: any) => {
      if (params.Email == undefined || params.Email == "") {
        this.processDownload(response, downloadToLocal);
      } else {
        this.notifier.success({ title: this._translateService.instant("TRANSLATE.PRODUCT_CATALOGUE_EMAIL_SENT_SUCCESSFULLY") })
      }
    },
    error => {
      this._toastService.error(this._translateService.instant('TRANSLATE.ERRRO_DESC_OCCURED_WHILE_PROCESSING_YOUR_REQUEST'));
    });
  }

  post(url: string, downloadToLocal: boolean = true, body: any = {}) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=UTF-8' });
    this._subscription = this._http.post(`${this.apiUrl}/${url}`, body, { headers: headers, responseType: 'arraybuffer', observe: 'response' }).subscribe((response: any) => {
      if(response?.body?.byteLength > 0 || (body.Email != undefined && body.Email != "")){
        if (body.Email == undefined || body.Email == "") {
          this.processDownload(response, downloadToLocal);
        } else {
          this.notifier.success({ title: this._translateService.instant("TRANSLATE.PRODUCT_CATALOGUE_EMAIL_SENT_SUCCESSFULLY") })
        }
      }
    },
    error => {
      this._toastService.error(this._translateService.instant('TRANSLATE.ERRRO_DESC_OCCURED_WHILE_PROCESSING_YOUR_REQUEST'));
    });
  }

  fileUpload(url: string, downloadToLocal: boolean = true, body: any = {}) {
    return this._http.post(`${this.apiUrl}/${url}`, body)
  }

  processDownload(response: any, downloadToLocal: boolean) {
    var headers = response.headers;
    var filename = decodeURIComponent(headers.get('FileName'));
    var contentType = headers.get('Content-Type');
    var linkElement = document.createElement('a');
    var isEdge = window.navigator.userAgent.indexOf("Edg") !== -1;
    if (filename !== null) {
      try {
        var blob = new Blob([response.body], { type: contentType });
        var url = window.URL.createObjectURL(blob);
        if (downloadToLocal) {
          linkElement.setAttribute('href', url);
          linkElement.setAttribute("download", filename);
          linkElement.dataset.downloadurl = [contentType, linkElement.download, linkElement.href].join(':');
          linkElement.click();

        }
        else {
          if (!isEdge) {
            // For Chrome and FF, window.open just works
            var handle = window.open(url, '_blank');
            if (handle === null) {
              /* Need to add swal confirmation instead of toast */
              Swal.fire({
                icon: "info",
                title: "Blocked",
                text: "Unblock popups for the downloaded file to be opened",
              });
            }
          }
          else {
            linkElement.setAttribute('href', url);
            linkElement.setAttribute("download", filename);
            var clickEvent = document.createEvent("MouseEvent");
            clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            linkElement.dispatchEvent(clickEvent);
          }
        }
      } catch (ex) {
        console.log(ex);
      }
    }
    else {
      this._toastService.error('Unable to process download!')
    }

  }

  getFileWithURL(path: string): Observable<HttpResponse<Blob>> {
    return this._http.get(path, { responseType: 'blob', observe: 'response' });
}

  getFileWithResponse(url: string, downloadToLocal: boolean = true, params: any = {}) {
    const option = this._commonService.buildHttpParamsObject(params)
    const headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=UTF-8' });
    return this._http.get(`${this.apiUrl}/${url}`, { headers, responseType: 'arraybuffer', observe: 'response', params: option })
    .pipe(
      tap((response)=>{
        if (params.Email == undefined || params.Email == "") {
          this.processDownload(response, downloadToLocal);
        } else {
          this.notifier.success({ title: this._translateService.instant("TRANSLATE.PRODUCT_CATALOGUE_EMAIL_SENT_SUCCESSFULLY") })
        }
        return of(response)
      })
    )
  }

}
