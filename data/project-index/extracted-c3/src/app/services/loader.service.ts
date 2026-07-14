// loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    private ___loadingSubject = new BehaviorSubject<boolean>(false);
    public $commonLoadingSubject = new BehaviorSubject<boolean>(false); 
    public isLayoutLoaded:boolean = false;

    private count:number=0;

    startLoading(): void { 
        this.___loadingSubject.next(true); 
    }

    commonStartLoading(): void {
        this.count++; 
        this.$commonLoadingSubject.next(true);
    }

    commonStopLoading(): void {
        this.count--;
        if(this.count < 1){
            this.$commonLoadingSubject.next(false);
        } 
    }

    resetCommonLoader(): void {
        this.count=0;
        this.$commonLoadingSubject.next(false); 
    }

    stopLoading(): void {
        this.___loadingSubject.next(false);
    }

    isLoading(): Observable<boolean> {
        return this.___loadingSubject.asObservable();
    }

    isCommonLoading(): Observable<boolean> {
        return this.$commonLoadingSubject.asObservable();
    }
    public showCommonLoading() {
    {
      const logoUrl = localStorage.getItem('loggedInLogo');
      if (
        logoUrl !== 'undefined' &&
        logoUrl !== null &&
        logoUrl &&
        document.getElementById('logo') &&
        (document.getElementById('logo') as any)?.src
      ) {
        (document.getElementById('logo') as any).src = logoUrl;
      }

      const translate = {
        ch: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: '问候，',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            '您现在已登录。请给我们一些时间来准备应用程序供您访问...',
        },
        de: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Schöne Grüße,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'Sie sind jetzt angemeldet. Geben Sie uns einen Moment Zeit, um die Anwendung für den Zugriff vorzubereiten...',
        },
        en: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Greetings, ',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'You are now logged in. Give us a moment to get the application ready for you to access...',
        },
        es: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: ' Saludos,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'Ya has iniciado sesión. Danos un momento para preparar la aplicación para que puedas acceder...',
        },
        fr: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Salutations,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            "Vous êtes maintenant connecté. Donnez-nous un moment pour préparer l'application pour que vous puissiez y accéder...",
        },
        it: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Ciao,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            "Hai effettuato l'accesso. L'applicazione sarà pronta tra poco...",
        },
        sk: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Dobrý deň,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'Teraz ste prihlásený. Dajte nám chvíľku, aby sme aplikáciu pripravili...',
        },
        th: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'ทักทาย,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'คุณได้ทำการเข้าสู่ระบบแล้ว โปรดรอสักครู่เพื่อเตรียมความพร้อมของแอปพลิเคชันให้คุณเข้าถึง ...',
        },
        tr: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: 'Selamlar,',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            'Şimdi giriş yaptınız. Uygulamayı erişebilmeniz için bize bir dakika verin ...',
        },
        tw: {
          LOGGED_IN_GETTING_DETAILS_GREETINGS: '您好，',
          LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT:
            '您現在已登入。請給我們一些時間以準備好應用供您訪問。。。',
        },
      };

      let loadingTextLanguage = localStorage.getItem('language');
      if (loadingTextLanguage == 'en-us') {
        loadingTextLanguage = 'en';
      }
      if (
        loadingTextLanguage !== 'undefined' &&
        loadingTextLanguage !== null &&
        loadingTextLanguage
      ) {
        document.getElementById('greetingsText').innerText =
          translate[loadingTextLanguage]['LOGGED_IN_GETTING_DETAILS_GREETINGS'];
        document.getElementById('pleaseWaitText').innerText =
          translate[loadingTextLanguage][
            'LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT'
          ];
      }

      let userNameText = localStorage.getItem('userName');
      if (
        userNameText !== 'undefined' &&
        userNameText !== null &&
        userNameText
      ) {
        document.getElementById('userNameText').innerText = userNameText
          .split('@')[0]
          .split('.')
          .join(' ');
      }
    }
  }
}
