import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-powerbi',
    templateUrl: './powerbi.component.html',
    styleUrls: ['./powerbi.component.scss']
})
export class PowerbiComponent
{
    reportUrl: SafeResourceUrl;

    constructor(private _sanitizer: DomSanitizer)
    {
        const powerBiUrl =
        'https://app.powerbi.com/groups/me/reports/d60139aa-53a6-414e-814a-5f260b7a7982/34be9d731670aebd4f8a?experience=power-bi';  
        this.reportUrl = this._sanitizer.bypassSecurityTrustResourceUrl(powerBiUrl);
    }
}