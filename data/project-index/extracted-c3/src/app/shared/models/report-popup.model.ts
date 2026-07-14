export class ReportPopupConfig {
    title:string;
    IsColumnsAvailable:boolean;
    EmailInstructionText: string;
    Columns:any;
    IsSubHeaderAvailable:boolean;
    actionTooltipText:string;
    isSubmitButton:boolean;
    showFavourite:boolean;
    constructor(){
        this.title='';
        this.IsColumnsAvailable = false;
        this.Columns=null;
        this.IsSubHeaderAvailable = false;
        this.showFavourite = false;
        this.isSubmitButton = false;
        this.actionTooltipText = '';
        this.EmailInstructionText = '';
    }
}

export const MODAL_DIALOG_CLASS = 'modal-dialog modal-dialog-top mw-800px'