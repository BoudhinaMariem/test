import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { IaTacheService, Sale } from './ia.tache.service';
import themes from 'devextreme/ui/themes';



@Component({
    selector: 'iatache',
    templateUrl: './ia.tache.component.html',
    encapsulation: ViewEncapsulation.None,

})
export class IatacheComponent implements OnInit, OnDestroy {

    sales: Sale[];

    allMode: string;

    checkBoxesMode: string;
    constructor(private iatacheservices: IaTacheService) {

        this.sales = iatacheservices.getSales();
        this.allMode = 'allPages';
        this.checkBoxesMode = themes.current().startsWith('material') ? 'always' : 'onClick';
    }


    ngOnInit(): void {
        // Get the data

    }

    ngOnDestroy(): void {

    }



}
