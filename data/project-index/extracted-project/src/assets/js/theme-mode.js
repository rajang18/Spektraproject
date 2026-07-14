// <!--begin::Theme mode setup on page load-->
if (document.documentElement) {
    var defaultThemeMode = "system";

    var hasKTName = document.body.hasAttribute("data-kt-name");
    var lsKey = "kt_" + (hasKTName ? name + "_" : "") + "theme_mode_value"
    var themeMode = localStorage.getItem(lsKey);
    if (!themeMode) {
      if (defaultThemeMode === "system") {
        themeMode =
          window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        themeMode = defaultThemeMode;
      }
    }

    document.documentElement.setAttribute("data-bs-theme", themeMode);
  }

  window.addEventListener('load', function () {
    const logoUrl = localStorage.getItem('loggedInLogo');
    if (logoUrl !== "undefined" && logoUrl !== null && logoUrl && document.getElementById('logo') && document.getElementById('logo')?.src) {
      document.getElementById('logo').src = logoUrl;
    }

    const translate = {
      'ch':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS" : '问候，',
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT": "您现在已登录。请给我们一些时间来准备应用程序供您访问...",
      },
      'de' :{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS" : 'Schöne Grüße,',
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Sie sind jetzt angemeldet. Geben Sie uns einen Moment Zeit, um die Anwendung für den Zugriff vorzubereiten...",
      },
      'en' : {
        "LOGGED_IN_GETTING_DETAILS_GREETINGS" : 'Greetings, ',
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT": "You are now logged in. Give us a moment to get the application ready for you to access...",
      },
      'es' : {
        "LOGGED_IN_GETTING_DETAILS_GREETINGS" : ' Saludos,',
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Ya has iniciado sesión. Danos un momento para preparar la aplicación para que puedas acceder...",
      },
      'fr':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"Salutations,",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Vous êtes maintenant connecté. Donnez-nous un moment pour préparer l'application pour que vous puissiez y accéder...",
      },
      'it':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"Ciao,",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Hai effettuato l'accesso. L'applicazione sarà pronta tra poco...",
      },
      'sk':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"Dobrý deň,",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Teraz ste prihlásený. Dajte nám chvíľku, aby sme aplikáciu pripravili...",
      },
      'th':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"ทักทาย,",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"คุณได้ทำการเข้าสู่ระบบแล้ว โปรดรอสักครู่เพื่อเตรียมความพร้อมของแอปพลิเคชันให้คุณเข้าถึง ...",
      },
      'tr':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"Selamlar,",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"Şimdi giriş yaptınız. Uygulamayı erişebilmeniz için bize bir dakika verin ...",
      },
      'tw':{
        "LOGGED_IN_GETTING_DETAILS_GREETINGS":"您好，",
        "LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT":"您現在已登入。請給我們一些時間以準備好應用供您訪問。。。",
      }
      
    }

    let entityName = localStorage.getItem('EntityName');
    let loadingTextLanguage = localStorage.getItem(`${entityName}-language`) || localStorage.getItem('language');
    if(loadingTextLanguage == 'en-us'){
      loadingTextLanguage = 'en';
    }
    if (loadingTextLanguage !== "undefined" && loadingTextLanguage !== null && loadingTextLanguage) {
      document.getElementById('greetingsText').innerText = translate[loadingTextLanguage]['LOGGED_IN_GETTING_DETAILS_GREETINGS'];
      document.getElementById('pleaseWaitText').innerText = translate[loadingTextLanguage]['LOGGED_IN_GETTING_DETAILS_PLEASE_WAIT'];
    }

    let userNameText = localStorage.getItem('userName');
    if (userNameText !== "undefined" && userNameText !== null && userNameText) {
      document.getElementById('userNameText').innerText = userNameText.split('@')[0].split('.').join(' ')
    }



  });
// <!--end::Theme mode setup on page load-->


// var stylesheetURLS = [ 
//     "assets/dataTables.bootstrap5.min.css",
//     "assets/toastr.css",
//     "assets/style.min.css",
//     "assets/summernote-lite.min.css",
//     "assets/socicon.css",
//     "assets/line-awesome.css",
//     "assets/prism-shades-of-purple.css",
//     "assets/bootstrap-icons.css",
//     "assets/animate.css",
//     "assets/plugins/keenicons/duotone/style.css",
//     "assets/plugins/keenicons/outline/style.css",
//     "assets/splash-screen.css",
//     "assets/plugins/keenicons/solid/style.css",
//     "assets/plugins/dataTables/dataTables.checkboxes.css",    
//     "assets/default.theme.css",
//     "assets/all.min.css"
//     ]
  //   stylesheetURLS.forEach(url => {
  //       fetch(url).then(response => response.text()).then(stylesheet => {
  //       var styleElement = document.createElement("style");
  //       styleElement.textContent = stylesheet;
  //       document.head.append(styleElement);
  // });
//});
