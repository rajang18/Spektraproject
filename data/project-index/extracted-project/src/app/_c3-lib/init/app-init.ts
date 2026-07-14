import { AppInitService } from "./app-init.service"; 

export function initializeApp(appInitService: AppInitService) {
  return (): Promise<any> => { 
    return appInitService.initializeApp().then(config => {
      console.log('Config loaded', config);
      // Do something with the config if needed
    }).catch(err => {
      console.error('Config loading failed', err);
    });
  };
}